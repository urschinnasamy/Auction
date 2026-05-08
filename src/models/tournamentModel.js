import { pool } from "../config/db.js";

// CREATE TOURNAMENT
export const createTournament = async (tournament) => {
  const {
    name,
    sport,
    auction_date,
    max_teams,
    purse_amount,
    description,
    tournament_logo,
    is_private,
    invite_code,
    created_by,
  } = tournament;

  const result = await pool.query(
    `
    INSERT INTO tournaments
    (
      name,
      sport,
      auction_date,
      max_teams,
      purse_amount,
      description,
      tournament_logo,
      is_private,
      invite_code,
      created_by
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      name,
      sport,
      auction_date,
      max_teams,
      purse_amount,
      description,
      tournament_logo,
      is_private,
      invite_code,
      created_by,
    ]
  );

  return result.rows[0];
};

// GET ALL
export const getAllTournaments = async () => {
  const result = await pool.query(`
    SELECT *
    FROM tournaments
    ORDER BY id DESC
  `);

  return result.rows;
};

// GET SINGLE
export const getTournamentById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM tournaments
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

// UPDATE
export const updateTournament = async (id, tournament) => {
  const {
    name,
    sport,
    auction_date,
    max_teams,
    purse_amount,
    description,
    tournament_logo,
    is_private,
    invite_code,
    status,
  } = tournament;

  const result = await pool.query(
    `
    UPDATE tournaments
    SET
      name = COALESCE($1, name),
      sport = COALESCE($2, sport),
      auction_date = COALESCE($3, auction_date),
      max_teams = COALESCE($4, max_teams),
      purse_amount = COALESCE($5, purse_amount),
      description = COALESCE($6, description),
      tournament_logo = COALESCE($7, tournament_logo),
      is_private = COALESCE($8, is_private),
      invite_code = COALESCE($9, invite_code),
      status = COALESCE($10, status)
    WHERE id = $11
    RETURNING *
    `,
    [
      name,
      sport,
      auction_date,
      max_teams,
      purse_amount,
      description,
      tournament_logo,
      is_private,
      invite_code,
      status,
      id,
    ]
  );

  return result.rows[0];
};

// DELETE
export const deleteTournament = async (id) => {
  await pool.query(
    `
    DELETE FROM tournaments
    WHERE id = $1
    `,
    [id]
  );
};