import xlsx from "xlsx";
import { pool } from "../config/db.js";

// read excel
const file = xlsx.readFile("data/Male_Cricket_Players.xlsx");

// ===== PLAYERS =====
const playersSheet = xlsx.utils.sheet_to_json(
  file.Sheets["Players"]
);

// ===== AUCTIONS =====
const auctionsSheet = xlsx.utils.sheet_to_json(
  file.Sheets["Auctions"]
);

// ===== BIDS =====
const bidsSheet = xlsx.utils.sheet_to_json(
  file.Sheets["Bids"]
);

const importData = async () => {
  try {
    // insert players
    for (let p of playersSheet) {
      await pool.query(
        "INSERT INTO players (id, name, role, base_price) VALUES ($1,$2,$3,$4)",
        [p["Player ID"], p.Name, p.Role, p["Base Price"]]
      );
    }

    // insert auctions
    for (let a of auctionsSheet) {
      await pool.query(
        "INSERT INTO auctions (id, player_id, current_price, status) VALUES ($1,$2,$3,$4)",
        [a["Auction ID"], a["Player ID"], a["Current Price"], a.Status]
      );
    }

    // insert bids
    for (let b of bidsSheet) {
      await pool.query(
        "INSERT INTO bids (id, auction_id, user_id, amount) VALUES ($1,$2,$3,$4)",
        [b["Bid ID"], b["Auction ID"], b["User ID"], b.Amount]
      );
    }

    console.log("✅ Data Imported Successfully");
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

importData();