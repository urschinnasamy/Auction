import { pool } from "../config/db.js";
import * as Auction from "../models/auctionModel.js";

/* -----------------------------
   START AUCTION
------------------------------*/
export const startAuction = async (req, res) => {
    try {
        const { id } = req.params;

        // Update tournament status to live
        const updated = await pool.query(
            `UPDATE tournaments 
             SET status = 'live' 
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ msg: "Tournament not found" });
        }

        // Add players to tournament
        await Auction.addPlayersToTournament(id);

        res.json({
            msg: "Auction started successfully",
            tournament: updated.rows[0],
        });
    } catch (err) {
        console.log("🔥 START AUCTION ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   GET PLAYERS (UNSOLD ONLY)
------------------------------*/
export const getPlayers = async (req, res) => {
    try {
        const { id } = req.params;
        const players = await Auction.getTournamentPlayers(id);
        res.json(players);
    } catch (err) {
        console.log("🔥 GET PLAYERS ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   GET ALL PLAYERS (INCLUDING SOLD)
------------------------------*/
export const getAllPlayers = async (req, res) => {
    try {
        const { id } = req.params;
        const players = await Auction.getAllTournamentPlayers(id);
        res.json(players);
    } catch (err) {
        console.log("🔥 GET ALL PLAYERS ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   PLACE BID
------------------------------*/
export const placeBid = async (req, res) => {
    try {
        const { player_id, team_id, amount } = req.body;

        if (!player_id || !team_id || !amount) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        // Get current max bid
        const { max_bid, highest_bidder_id } = await Auction.getMaxBid(player_id);

        if (amount <= max_bid) {
            return res.status(400).json({
                msg: `Bid must be higher than current bid of ₹${max_bid.toLocaleString()}`,
                current_bid: max_bid
            });
        }

        // Check if the same team is trying to outbid themselves
        if (highest_bidder_id === team_id) {
            return res.status(400).json({
                msg: "Your team is already the highest bidder"
            });
        }

        // Check team budget
        const teamBudget = await Auction.getTeamBudget(team_id);
        if (!teamBudget || teamBudget.remaining_purse < amount) {
            return res.status(400).json({
                msg: `Insufficient budget. Available: ₹${teamBudget?.remaining_purse?.toLocaleString() || 0}`
            });
        }

        // Place the bid
        const bid = await Auction.placeBid(player_id, team_id, amount);

        // Get team details for response
        const teamResult = await pool.query(
            `SELECT team_name, remaining_purse FROM teams WHERE id = $1`,
            [team_id]
        );

        res.json({
            ...bid,
            team_name: teamResult.rows[0]?.team_name,
            remaining_purse: teamResult.rows[0]?.remaining_purse,
            message: "Bid placed successfully"
        });
    } catch (err) {
        console.log("🔥 PLACE BID ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   SELL PLAYER
------------------------------*/
export const sellPlayer = async (req, res) => {
    try {
        const { tournament_id, player_id, team_id, price } = req.body;

        if (!tournament_id || !player_id || !team_id || !price) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        // Get the highest bid to verify
        const highestBid = await Auction.getHighestBidder(player_id);

        if (!highestBid || highestBid.team_id !== team_id) {
            return res.status(400).json({ 
                msg: "Cannot sell: This team is not the highest bidder" 
            });
        }

        if (price !== highestBid.amount) {
            return res.status(400).json({ 
                msg: "Price does not match the highest bid" 
            });
        }

        // Check if team has enough budget
        const teamBudget = await Auction.getTeamBudget(team_id);
        if (!teamBudget || teamBudget.remaining_purse < price) {
            return res.status(400).json({
                msg: `Team doesn't have enough budget. Available: ₹${teamBudget?.remaining_purse?.toLocaleString()}`
            });
        }

        // Sell the player
        const sold = await Auction.sellPlayer(tournament_id, player_id, team_id, price);

        // Get team name and updated budget
        const teamResult = await pool.query(
            `SELECT team_name, remaining_purse FROM teams WHERE id = $1`,
            [team_id]
        );

        res.json({
            ...sold,
            team_name: teamResult.rows[0]?.team_name,
            remaining_purse: teamResult.rows[0]?.remaining_purse,
            msg: "Player sold successfully"
        });
    } catch (err) {
        console.log("🔥 SELL PLAYER ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   UNSOLD PLAYER (SKIP)
------------------------------*/
export const unsoldPlayer = async (req, res) => {
    try {
        const { tournament_id, player_id } = req.body;

        if (!tournament_id || !player_id) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        res.json({ 
            msg: "Player marked as unsold",
            player_id: player_id,
            tournament_id: tournament_id
        });
    } catch (err) {
        console.log("🔥 UNSOLD PLAYER ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   FINISH AUCTION
------------------------------*/
export const finishAuction = async (req, res) => {
    try {
        const { id } = req.params;

        // Update tournament status to completed
        const tournament = await Auction.updateTournamentStatus(id, "completed");

        if (!tournament) {
            return res.status(404).json({ msg: "Tournament not found" });
        }

        res.json({
            msg: "Auction finished successfully",
            tournament: tournament
        });
    } catch (err) {
        console.log("🔥 FINISH AUCTION ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   GET TOURNAMENT TEAMS
------------------------------*/
export const getTournamentTeams = async (req, res) => {
    try {
        const { id } = req.params;
        const teams = await Auction.getTournamentTeams(id);
        res.json(teams);
    } catch (err) {
        console.log("🔥 GET TOURNAMENT TEAMS ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   GET SOLD PLAYERS
------------------------------*/
export const getSoldPlayers = async (req, res) => {
    try {
        const { id } = req.params;
        const soldPlayers = await Auction.getSoldPlayers(id);
        res.json(soldPlayers);
    } catch (err) {
        console.log("🔥 GET SOLD PLAYERS ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   GET AUCTION STATUS
------------------------------*/
export const getAuctionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const players = await Auction.getTournamentPlayers(id);
        const totalPlayers = players.length;
        
        const isComplete = await Auction.isTournamentComplete(id);
        
        // Get tournament status
        const tournamentResult = await pool.query(
            `SELECT status FROM tournaments WHERE id = $1`,
            [id]
        );
        
        res.json({
            tournament_id: id,
            remaining_players: totalPlayers,
            sold_players: players.filter(p => p.is_sold).length,
            is_complete: isComplete,
            status: tournamentResult.rows[0]?.status || "active"
        });
    } catch (err) {
        console.log("🔥 GET AUCTION STATUS ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   GET TEAM BUDGET
------------------------------*/
export const getTeamBudget = async (req, res) => {
    try {
        const { team_id } = req.params;
        const budget = await Auction.getTeamBudget(team_id);
        res.json(budget);
    } catch (err) {
        console.log("🔥 GET TEAM BUDGET ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};

/* -----------------------------
   RESET AUCTION (ADMIN ONLY)
------------------------------*/
export const resetAuction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Reset all players in tournament
        await pool.query(
            `UPDATE tournament_players
             SET is_sold = false,
                 sold_price = NULL,
                 sold_to_team_id = NULL
             WHERE tournament_id = $1`,
            [id]
        );
        
        // Clear all bids for this tournament
        await pool.query(
            `DELETE FROM bids 
             WHERE player_id IN (
                 SELECT player_id FROM tournament_players WHERE tournament_id = $1
             )`,
            [id]
        );
        
        // Reset team budgets
        await Auction.resetTeamBudgets(id);
        
        // Reset tournament status
        await Auction.updateTournamentStatus(id, "upcoming");
        
        res.json({ msg: "Auction reset successfully" });
    } catch (err) {
        console.log("🔥 RESET AUCTION ERROR:", err);
        res.status(500).json({ msg: err.message });
    }
};