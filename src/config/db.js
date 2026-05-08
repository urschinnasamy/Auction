import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString="postgresql://postgres:[YOUR-PASSWORD]@db.xzfcplbcanartidezjgp.supabase.co:5432/postgres"
});