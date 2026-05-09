import { pool } from "../config/db.js";
import * as Auction from "../models/auctionModel.js";

/* -----------------------------
   START AUCTION
------------------------------*/
export const startAuction = async (req, res) => {
    try {
        const { id } = req.params;

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

        await Auction.addPlayersToTournament(id);

        res.json({
            success: true,
            msg: "Auction started successfully",
            tournament: updated.rows[0],
        });
    } catch (err) {
        console.error("START AUCTION ERROR:", err);
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
        res.json(players || []);
    } catch (err) {
        console.error("GET PLAYERS ERROR:", err);
        res.status(200).json([]);
    }
};

/* -----------------------------
   GET ALL PLAYERS
------------------------------*/
export const getAllPlayers = async (req, res) => {
    try {
        const { id } = req.params;
        const players = await Auction.getAllTournamentPlayers(id);
        res.json(players || []);
    } catch (err) {
        console.error("GET ALL PLAYERS ERROR:", err);
        res.status(200).json([]);
    }
};

/* -----------------------------
   PLACE BID
------------------------------*/
export const placeBid = async (req, res) => {
    try {
        const { tournament_id, player_id, team_id, amount } = req.body;

        console.log("📝 Bid Request:", { tournament_id, player_id, team_id, amount });

        // Validate required fields
        if (!tournament_id) {
            return res.status(400).json({ msg: "tournament_id is required" });
        }
        if (!player_id) {
            return res.status(400).json({ msg: "player_id is required" });
        }
        if (!team_id) {
            return res.status(400).json({ msg: "team_id is required" });
        }
        if (!amount) {
            return res.status(400).json({ msg: "amount is required" });
        }

        const bidAmount = parseFloat(amount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return res.status(400).json({ msg: "Invalid bid amount" });
        }

        // Get current max bid
        const { max_bid, highest_bidder_id } = await Auction.getMaxBid(player_id, tournament_id);

        console.log("💰 Current max bid:", max_bid, "Highest bidder:", highest_bidder_id);

        // Check if bid is higher
        if (bidAmount <= max_bid) {
            return res.status(400).json({
                success: false,
                msg: `Bid must be higher than current bid of ₹${max_bid.toLocaleString()}`,
                current_bid: max_bid,
                your_bid: bidAmount
            });
        }

        // Check if same team is bidding
        if (highest_bidder_id === team_id) {
            return res.status(400).json({
                success: false,
                msg: "Your team is already the highest bidder"
            });
        }

        // Check team budget
        const teamBudget = await Auction.getTeamBudget(team_id);
        if (!teamBudget || teamBudget.remaining_purse < bidAmount) {
            return res.status(400).json({
                success: false,
                msg: `Insufficient budget. Available: ₹${teamBudget?.remaining_purse?.toLocaleString() || 0}`
            });
        }

        // Place the bid
        const bid = await Auction.placeBid(tournament_id, player_id, team_id, bidAmount);

        // Get team details
        const teamResult = await pool.query(
            `SELECT team_name, remaining_purse FROM teams WHERE id = $1`,
            [team_id]
        );

        console.log("✅ Bid placed successfully");

        res.json({
            success: true,
            id: bid.id,
            player_id: bid.player_id,
            team_id: bid.team_id,
            amount: parseFloat(bid.amount),
            team_name: teamResult.rows[0]?.team_name,
            remaining_purse: parseFloat(teamResult.rows[0]?.remaining_purse || 0),
            message: "Bid placed successfully"
        });
    } catch (err) {
        console.error("PLACE BID ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   SELL PLAYER (AUTOMATIC SELL)
------------------------------*/
/* -----------------------------
   SELL PLAYER (AUTOMATIC SELL)
------------------------------*/
export const sellPlayer = async (req, res) => {
    try {
        const { tournament_id, player_id, team_id, price } = req.body;

        console.log("💰 Sell Request Details:", { tournament_id, player_id, team_id, price });

        // Validate required fields
        if (!tournament_id) {
            return res.status(400).json({ 
                success: false, 
                msg: "tournament_id is required" 
            });
        }
        if (!player_id) {
            return res.status(400).json({ 
                success: false, 
                msg: "player_id is required" 
            });
        }
        if (!team_id) {
            return res.status(400).json({ 
                success: false, 
                msg: "team_id is required" 
            });
        }
        if (!price) {
            return res.status(400).json({ 
                success: false, 
                msg: "price is required" 
            });
        }

        const sellPrice = parseFloat(price);
        if (isNaN(sellPrice) || sellPrice <= 0) {
            return res.status(400).json({ 
                success: false, 
                msg: "Invalid price amount" 
            });
        }

        // Check if player exists and is not already sold
        const checkPlayer = await pool.query(
            `SELECT is_sold, sold_to_team_id 
             FROM tournament_players 
             WHERE tournament_id = $1 AND player_id = $2`,
            [tournament_id, player_id]
        );

        if (checkPlayer.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                msg: "Player not found in this tournament" 
            });
        }

        if (checkPlayer.rows[0].is_sold) {
            return res.status(400).json({ 
                success: false, 
                msg: "Player is already sold" 
            });
        }

        // Check team budget
        const teamBudget = await pool.query(
            `SELECT remaining_purse, team_name FROM teams WHERE id = $1`,
            [team_id]
        );

        if (teamBudget.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                msg: "Team not found" 
            });
        }

        if (teamBudget.rows[0].remaining_purse < sellPrice) {
            return res.status(400).json({
                success: false,
                msg: `Insufficient budget. Available: ₹${teamBudget.rows[0].remaining_purse.toLocaleString()}`
            });
        }

        // Sell the player
        const result = await pool.query(
            `
            UPDATE tournament_players
            SET is_sold = true,
                sold_price = $1,
                sold_to_team_id = $2,
                sold_at = NOW()
            WHERE tournament_id = $3
              AND player_id = $4
            RETURNING *
            `,
            [sellPrice, team_id, tournament_id, player_id]
        );

        // Update team's remaining purse
        await pool.query(
            `
            UPDATE teams
            SET remaining_purse = remaining_purse - $1,
                budget_used = COALESCE(budget_used, 0) + $1
            WHERE id = $2
            `,
            [sellPrice, team_id]
        );

        console.log("✅ Player sold successfully:", result.rows[0]);

        res.json({
            success: true,
            sold: result.rows[0],
            team_name: teamBudget.rows[0].team_name,
            remaining_purse: teamBudget.rows[0].remaining_purse - sellPrice,
            msg: "Player sold successfully"
        });
    } catch (err) {
        console.error("SELL PLAYER ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   MARK PLAYER AS UNSOLD
------------------------------*/
export const unsoldPlayer = async (req, res) => {
    try {
        const { tournament_id, player_id } = req.body;

        console.log("❌ Unsold Request:", { tournament_id, player_id });

        if (!tournament_id || !player_id) {
            return res.status(400).json({ 
                success: false, 
                msg: "Missing required fields" 
            });
        }

        const unsold = await Auction.markUnsold(tournament_id, player_id);

        console.log("✅ Player marked as unsold");

        res.json({ 
            success: true,
            msg: "Player marked as unsold",
            player_id: player_id,
            tournament_id: tournament_id,
            player: unsold
        });
    } catch (err) {
        console.error("UNSOLD PLAYER ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   FINISH AUCTION
------------------------------*/

/* -----------------------------
   FINISH AUCTION
------------------------------*/
/* -----------------------------
   FINISH AUCTION
------------------------------*/
export const finishAuction = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("🏆 Finishing auction for tournament:", id);

        // Simple direct update without any complex queries first
        const result = await pool.query(
            "UPDATE tournaments SET status = 'completed' WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                msg: "Tournament not found" 
            });
        }

        console.log("✅ Tournament updated:", result.rows[0]);

        res.json({
            success: true,
            msg: "Auction finished successfully",
            tournament: result.rows[0]
        });
    } catch (err) {
        console.error("FINISH AUCTION ERROR:", err);
        res.status(500).json({ 
            success: false, 
            msg: err.message,
            error: err.toString()
        });
    }
};
/* -----------------------------
   GET TOURNAMENT TEAMS
------------------------------*/
export const getTournamentTeams = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json([]);
        }
        
        const teams = await Auction.getTournamentTeams(id);
        res.json(teams || []);
    } catch (err) {
        console.error("GET TOURNAMENT TEAMS ERROR:", err);
        res.status(200).json([]);
    }
};

/* -----------------------------
   GET SOLD PLAYERS
------------------------------*/
export const getSoldPlayers = async (req, res) => {
    try {
        const { id } = req.params;
        const soldPlayers = await Auction.getSoldPlayers(id);
        res.json(soldPlayers || []);
    } catch (err) {
        console.error("GET SOLD PLAYERS ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   GET UNSOLD PLAYERS
------------------------------*/
export const getUnsoldPlayers = async (req, res) => {
    try {
        const { id } = req.params;
        const unsoldPlayers = await Auction.getUnsoldPlayers(id);
        res.json(unsoldPlayers || []);
    } catch (err) {
        console.error("GET UNSOLD PLAYERS ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   GET AUCTION STATUS
------------------------------*/
export const getAuctionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const players = await Auction.getTournamentPlayers(id);
        const soldPlayers = await Auction.getSoldPlayers(id);
        const unsoldPlayers = await Auction.getUnsoldPlayers(id);
        const isComplete = await Auction.isTournamentComplete(id);
        
        const tournamentResult = await pool.query(
            `SELECT status FROM tournaments WHERE id = $1`,
            [id]
        );
        
        res.json({
            success: true,
            tournament_id: id,
            total_players: players.length + soldPlayers.length,
            remaining_players: players.length,
            sold_players: soldPlayers.length,
            unsold_players: unsoldPlayers.length,
            is_complete: isComplete,
            status: tournamentResult.rows[0]?.status || "active"
        });
    } catch (err) {
        console.error("GET AUCTION STATUS ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   GET TEAM BUDGET
------------------------------*/
export const getTeamBudget = async (req, res) => {
    try {
        const { team_id } = req.params;
        const budget = await Auction.getTeamBudget(team_id);
        res.json(budget || {});
    } catch (err) {
        console.error("GET TEAM BUDGET ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   RESET AUCTION
------------------------------*/
export const resetAuction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Reset all players in tournament
        await pool.query(
            `UPDATE tournament_players
             SET is_sold = false,
                 sold_price = NULL,
                 sold_to_team_id = NULL,
                 sold_at = NULL
             WHERE tournament_id = $1`,
            [id]
        );
        
        // Delete all bids for this tournament
        await pool.query(
            `DELETE FROM bids WHERE tournament_id = $1`,
            [id]
        );
        
        // Reset team budgets
        await Auction.resetTeamBudgets(id);
        
        // Update tournament status
        await Auction.updateTournamentStatus(id, "upcoming");
        
        res.json({ 
            success: true, 
            msg: "Auction reset successfully" 
        });
    } catch (err) {
        console.error("RESET AUCTION ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};

/* -----------------------------
   GET CURRENT PLAYER
------------------------------*/
export const getCurrentPlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const currentPlayer = await Auction.getCurrentPlayerIndex(id);
        res.json(currentPlayer || null);
    } catch (err) {
        console.error("GET CURRENT PLAYER ERROR:", err);
        res.status(500).json({ success: false, msg: err.message });
    }
};