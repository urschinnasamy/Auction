import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString="postgresql://postgres:[Auction_!@#$AT]@db.xzfcplbcanartidezjgp.supabase.co:5432/postgres"
});