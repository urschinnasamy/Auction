import { pool } from "../config/db.js";

// ===============================
// GET ALL PLAYERS
// ===============================
export const getAllPlayers = async () => {
  const result = await pool.query(`
    SELECT * FROM male_cricket_players
    ORDER BY id ASC
  `);

  return result.rows;
};

// ===============================
// CREATE PLAYER
// ===============================
export const createPlayer = async (player) => {
  const {
    name,
    image,
    gender,
    position,
  } = player;

  const result = await pool.query(
    `
    INSERT INTO male_cricket_players
    (name, image, gender, position)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      name,
      image,
      gender,
      position,
    ]
  );

  return result.rows[0];
};

// ===============================
// UPDATE PLAYER
// ===============================
export const updatePlayer = async (id, player) => {
  const {
    name,
    image,
    gender,
    position,
  } = player;

  const result = await pool.query(
    `
    UPDATE male_cricket_players
    SET
      name = $1,
      image = $2,
      gender = $3,
      position = $4
    WHERE id = $5
    RETURNING *
    `,
    [
      name,
      image,
      gender,
      position,
      id,
    ]
  );

  return result.rows[0];
};

// ===============================
// DELETE PLAYER
// ===============================
export const deletePlayer = async (id) => {
  await pool.query(
    `
    DELETE FROM male_cricket_players
    WHERE id = $1
    `,
    [id]
  );
};

// ===============================
// DELETE ALL PLAYERS
// ===============================
export const deleteAllPlayers = async () => {
  await pool.query(`
    DELETE FROM male_cricket_players
  `);
};

// ===============================
// BULK INSERT PLAYERS
// ===============================
export const bulkInsertPlayers = async (players) => {
  for (const player of players) {
    await pool.query(
      `
      INSERT INTO male_cricket_players
      (name, image, gender, position)
      VALUES ($1, $2, $3, $4)
      `,
      [
        player.name,
        player.image,
        player.gender,
        player.position,
      ]
    );
  }
};