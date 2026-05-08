import { pool } from "../config/db.js";

/* -----------------------------
   ADD PLAYERS TO TOURNAMENT
------------------------------*/
export const addPlayersToTournament = async (tournamentId) => {
    const result = await pool.query(
        `
        INSERT INTO tournament_players (tournament_id, player_id)
        SELECT $1, id 
        FROM male_cricket_players
        WHERE id NOT IN (
            SELECT player_id 
            FROM tournament_players 
            WHERE tournament_id = $1
        )
        RETURNING *
        `,
        [tournamentId]
    );
    return result.rows;
};

/* -----------------------------
   GET TOURNAMENT PLAYERS (UNSOLD ONLY)
------------------------------*/
export const getTournamentPlayers = async (tournamentId) => {
    const result = await pool.query(
        `
        SELECT 
            tp.id as tournament_player_id,
            tp.is_sold,
            tp.sold_price,
            tp.sold_to_team_id,
            p.id as player_id,
            p.name,
            p.image,
            p.position,
            p.base_price
        FROM tournament_players tp
        JOIN male_cricket_players p ON p.id = tp.player_id
        WHERE tp.tournament_id = $1
        AND tp.is_sold = false
        ORDER BY tp.id ASC
        `,
        [tournamentId]
    );
    return result.rows;
};

/* -----------------------------
   GET ALL TOURNAMENT PLAYERS (INCLUDING SOLD)
------------------------------*/
export const getAllTournamentPlayers = async (tournamentId) => {
    const result = await pool.query(
        `
        SELECT 
            tp.id as tournament_player_id,
            tp.is_sold,
            tp.sold_price,
            tp.sold_to_team_id,
            p.id as player_id,
            p.name,
            p.image,
            p.position,
            p.base_price,
            t.team_name as sold_to_team
        FROM tournament_players tp
        JOIN male_cricket_players p ON p.id = tp.player_id
        LEFT JOIN teams t ON t.id = tp.sold_to_team_id
        WHERE tp.tournament_id = $1
        ORDER BY tp.id ASC
        `,
        [tournamentId]
    );
    return result.rows;
};

/* -----------------------------
   PLACE BID
------------------------------*/
export const placeBid = async (player_id, team_id, amount) => {
    // Check if player is already sold
    const checkSold = await pool.query(
        `SELECT is_sold FROM tournament_players 
         WHERE player_id = $1 AND tournament_id IN 
         (SELECT tournament_id FROM teams WHERE id = $2)`,
        [player_id, team_id]
    );
    
    if (checkSold.rows[0]?.is_sold) {
        throw new Error("Player is already sold");
    }
    
    // Check if team has enough budget (using remaining_purse column)
    const teamBudget = await pool.query(
        `SELECT remaining_purse FROM teams WHERE id = $1`,
        [team_id]
    );
    
    if (teamBudget.rows[0]?.remaining_purse < amount) {
        throw new Error(`Insufficient budget. Available: ₹${teamBudget.rows[0]?.remaining_purse?.toLocaleString()}`);
    }
    
    const result = await pool.query(
        `
        INSERT INTO bids (player_id, team_id, amount)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [player_id, team_id, amount]
    );
    return result.rows[0];
};

/* -----------------------------
   GET MAX BID FOR PLAYER
------------------------------*/
export const getMaxBid = async (player_id) => {
    const result = await pool.query(
        `
        SELECT COALESCE(MAX(amount), 0) as max_bid,
               (SELECT team_id FROM bids WHERE player_id = $1 
                ORDER BY amount DESC LIMIT 1) as highest_bidder_id
        FROM bids
        WHERE player_id = $1
        `,
        [player_id]
    );
    return {
        max_bid: result.rows[0].max_bid,
        highest_bidder_id: result.rows[0].highest_bidder_id
    };
};

/* -----------------------------
   GET HIGHEST BIDDER DETAILS
------------------------------*/
export const getHighestBidder = async (player_id) => {
    const result = await pool.query(
        `
        SELECT 
            b.amount,
            b.team_id,
            t.team_name,
            t.user_id
        FROM bids b
        JOIN teams t ON t.id = b.team_id
        WHERE b.player_id = $1
        ORDER BY b.amount DESC
        LIMIT 1
        `,
        [player_id]
    );
    return result.rows[0];
};

/* -----------------------------
   SELL PLAYER
------------------------------*/
export const sellPlayer = async (tournament_id, player_id, team_id, price) => {
    // Start a transaction
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Update tournament_players table
        const result = await client.query(
            `
            UPDATE tournament_players
            SET is_sold = true,
                sold_price = $1,
                sold_to_team_id = $2
            WHERE tournament_id = $3
              AND player_id = $4
            RETURNING *
            `,
            [price, team_id, tournament_id, player_id]
        );
        
        // Update team's remaining purse (deduct sold price)
        // Using remaining_purse column from your schema
        await client.query(
            `
            UPDATE teams
            SET remaining_purse = remaining_purse - $1,
                budget_used = COALESCE(budget_used, 0) + $1
            WHERE id = $2
            `,
            [price, team_id]
        );
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/* -----------------------------
   GET TOURNAMENT TEAMS
------------------------------*/
export const getTournamentTeams = async (tournament_id) => {
    const result = await pool.query(
        `
        SELECT 
            t.id,
            t.team_name,
            t.team_logo,
            t.user_id,
            t.remaining_purse,
            t.budget_used,
            t.purse_amount,
            COALESCE(t.remaining_purse, t.purse_amount, 0) as available_budget,
            u.name as owner_name
        FROM teams t
        JOIN users u ON u.id = t.user_id
        WHERE t.tournament_id = $1
        `,
        [tournament_id]
    );
    return result.rows;
};

/* -----------------------------
   GET SOLD PLAYERS FOR TOURNAMENT
------------------------------*/
export const getSoldPlayers = async (tournament_id) => {
    const result = await pool.query(
        `
        SELECT 
            p.name,
            p.position,
            tp.sold_price,
            t.team_name as sold_to_team,
            t.id as team_id
        FROM tournament_players tp
        JOIN male_cricket_players p ON p.id = tp.player_id
        JOIN teams t ON t.id = tp.sold_to_team_id
        WHERE tp.tournament_id = $1
        AND tp.is_sold = true
        ORDER BY tp.id ASC
        `,
        [tournament_id]
    );
    return result.rows;
};

/* -----------------------------
   UPDATE TOURNAMENT STATUS
------------------------------*/
export const updateTournamentStatus = async (tournament_id, status) => {
    const result = await pool.query(
        `
        UPDATE tournaments
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [status, tournament_id]
    );
    return result.rows[0];
};

/* -----------------------------
   CHECK IF ALL PLAYERS ARE PROCESSED
------------------------------*/
export const isTournamentComplete = async (tournament_id) => {
    const result = await pool.query(
        `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN is_sold = true THEN 1 ELSE 0 END) as sold
        FROM tournament_players
        WHERE tournament_id = $1
        `,
        [tournament_id]
    );
    
    const { total, sold } = result.rows[0];
    return total === parseInt(sold);
};

/* -----------------------------
   GET TEAM REMAINING BUDGET
------------------------------*/
export const getTeamBudget = async (team_id) => {
    const result = await pool.query(
        `
        SELECT remaining_purse, budget_used, purse_amount
        FROM teams
        WHERE id = $1
        `,
        [team_id]
    );
    return result.rows[0];
};

/* -----------------------------
   RESET TEAM BUDGETS FOR TOURNAMENT
------------------------------*/
export const resetTeamBudgets = async (tournament_id) => {
    const result = await pool.query(
        `
        UPDATE teams
        SET remaining_purse = purse_amount,
            budget_used = 0
        WHERE tournament_id = $1
        RETURNING *
        `,
        [tournament_id]
    );
    return result.rows;
};