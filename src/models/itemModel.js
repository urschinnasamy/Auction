import { pool } from "../config/db.js";

// create item
export const createItem = async (data) => {
  const { title, description, starting_price, userId } = data;

  const result = await pool.query(
    `INSERT INTO items 
    (title, description, starting_price, current_price, created_by, start_time, end_time)
    VALUES ($1,$2,$3,$3,$4,NOW(), NOW() + INTERVAL '1 hour')
    RETURNING *`,
    [title, description, starting_price, userId]
  );

  return result.rows[0];
};

// get all items
export const getItems = async () => {
  const result = await pool.query(
    "SELECT * FROM items ORDER BY id DESC"
  );
  return result.rows;
};

// get single item
export const getItemById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM items WHERE id=$1",
    [id]
  );
  return result.rows[0];
};