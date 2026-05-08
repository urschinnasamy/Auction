import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: "postgresql://postgres:Auction_!%40%23%24AT@db.xzfcplbcanartidezjgp.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});