import express from "express";
import {
    startAuction,
    getPlayers,
    getAllPlayers,
    placeBid,
    sellPlayer,
    unsoldPlayer,
    finishAuction,
    getTournamentTeams,
    getSoldPlayers,
    getAuctionStatus,
    getTeamBudget,
    resetAuction,
} from "../controllers/auctionController.js";

const router = express.Router();

// Start auction
router.put("/start/:id", startAuction);

// Get players (unsold only)
router.get("/players/:id", getPlayers);

// Get all players (including sold)
router.get("/players/all/:id", getAllPlayers);

// Get tournament teams
router.get("/teams/:id", getTournamentTeams);

// Get sold players
router.get("/sold/:id", getSoldPlayers);

// Get auction status
router.get("/status/:id", getAuctionStatus);

// Get team budget
router.get("/budget/:team_id", getTeamBudget);

// Place a bid
router.post("/bids", placeBid);

// Sell a player
router.post("/sell", sellPlayer);

// Mark player as unsold
router.post("/unsold", unsoldPlayer);

// Finish auction
router.post("/finish/:id", finishAuction);

// Reset auction (admin only - add auth middleware)
router.post("/reset/:id", resetAuction);

export default router;