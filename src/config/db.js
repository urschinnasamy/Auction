import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString="postgresql://auction:pE1Tv9mTG7Ty5EVoGiLijWtMuvWGk9wO@dpg-d7ur4hbrjlhs7397ecjg-a/auction_db_t9wb"
});