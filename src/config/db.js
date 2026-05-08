import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString:
    "postgresql://postgres.xzfcplbcanartidezjgp:Auction_!%40%23%24AT@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",

  ssl: {
    rejectUnauthorized: false,
  },
});