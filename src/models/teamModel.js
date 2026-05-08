import { pool } from "../config/db.js";

// CREATE TEAM WITH BUDGET SPLIT
export const createTeam = async (team) => {
  const {
    tournament_id,
    user_id,
    team_name,
    team_logo,
  } = team;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // CHECK IF USER ALREADY JOINED
    const existing = await client.query(
      `SELECT * FROM teams WHERE tournament_id = $1 AND user_id = $2`,
      [tournament_id, user_id]
    );

    if (existing.rows.length > 0) {
      throw new Error("You already joined this tournament");
    }

    // GET TOURNAMENT DETAILS
    const tournament = await client.query(
      `SELECT max_teams, purse_amount, 
              (SELECT COUNT(*) FROM teams WHERE tournament_id = $1) as current_teams
       FROM tournaments 
       WHERE id = $1
       FOR UPDATE`,
      [tournament_id]
    );

    if (tournament.rows.length === 0) {
      throw new Error("Tournament not found");
    }

    const { max_teams, purse_amount, current_teams } = tournament.rows[0];

    // CHECK IF TOURNAMENT IS FULL
    if (current_teams >= max_teams) {
      throw new Error("Tournament is full");
    }

    // CALCULATE BUDGET FOR EACH TEAM (EQUAL SPLIT)
    // Using Math.floor to avoid decimals
    let team_budget = Math.floor(purse_amount / max_teams);
    
    console.log(`💰 Tournament ${tournament_id}: Total=${purse_amount}, Max Teams=${max_teams}, Current Teams=${current_teams}, Per Team=${team_budget}`);

    // CREATE TEAM WITH ALLOCATED BUDGET
    const result = await client.query(
      `
      INSERT INTO teams
      (tournament_id, user_id, team_name, team_logo, initial_budget, remaining_budget, used_budget, registration_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
      RETURNING *
      `,
      [tournament_id, user_id, team_name, team_logo, team_budget, team_budget, 0]
    );

    await client.query('COMMIT');
    
    return {
      ...result.rows[0],
      allocated_budget: team_budget,
      total_tournament_budget: purse_amount,
      total_teams: max_teams,
      current_teams: current_teams + 1,
      message: `Team created successfully! Budget: ₹${team_budget.toLocaleString()}`
    };
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// GET TEAMS BY TOURNAMENT
export const getTeamsByTournament = async (tournament_id) => {
  const result = await pool.query(
    `
    SELECT 
      t.id,
      t.tournament_id,
      t.user_id,
      t.team_name,
      t.team_logo,
      t.initial_budget,
      t.remaining_budget,
      t.used_budget,
      t.registration_status,
      t.created_at,
      u.name as owner_name,
      u.email as owner_email
    FROM teams t
    JOIN users u ON u.id = t.user_id
    WHERE t.tournament_id = $1
    ORDER BY t.id DESC
    `,
    [tournament_id]
  );

  return result.rows;
};

// GET TEAM BY ID
export const getTeamById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM teams
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

// DELETE TEAM
export const deleteTeam = async (id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get team details before deletion
    const team = await client.query(
      `
      SELECT tournament_id, initial_budget
      FROM teams
      WHERE id = $1
      `,
      [id]
    );
    
    if (team.rows.length === 0) {
      throw new Error("Team not found");
    }
    
    const { tournament_id, initial_budget } = team.rows[0];
    
    // Delete the team
    await client.query(
      `
      DELETE FROM teams
      WHERE id = $1
      `,
      [id]
    );
    
    await client.query('COMMIT');
    
    return { 
      msg: "Team deleted successfully",
      returned_budget: initial_budget
    };
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// UPDATE TEAM BUDGET (AFTER BUYING PLAYERS)
export const updateTeamBudget = async (team_id, amount) => {
  const result = await pool.query(
    `
    UPDATE teams
    SET remaining_budget = remaining_budget - $1,
        used_budget = used_budget + $1
    WHERE id = $2
    RETURNING *
    `,
    [amount, team_id]
  );

  return result.rows[0];
};

// GET TEAM BUDGET INFO
export const getTeamBudgetInfo = async (team_id) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      team_name,
      initial_budget,
      remaining_budget,
      used_budget,
      (initial_budget - remaining_budget) as spent_budget
    FROM teams
    WHERE id = $1
    `,
    [team_id]
  );

  return result.rows[0];
};

// GET ALL TEAMS WITH BUDGET INFO FOR TOURNAMENT
export const getAllTeamsWithBudget = async (tournament_id) => {
  const result = await pool.query(
    `
    SELECT 
      t.id,
      t.team_name,
      t.team_logo,
      t.initial_budget,
      t.remaining_budget,
      t.used_budget,
      u.name as owner_name,
      COUNT(tp.id) as players_bought,
      COALESCE(SUM(tp.sold_price), 0) as total_spent
    FROM teams t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN tournament_players tp ON tp.sold_to_team_id = t.id AND tp.is_sold = true
    WHERE t.tournament_id = $1
    GROUP BY t.id, u.name
    ORDER BY t.remaining_budget DESC
    `,
    [tournament_id]
  );

  return result.rows;
};