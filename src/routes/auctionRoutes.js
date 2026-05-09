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
    getUnsoldPlayers,
    getAuctionStatus,
    getTeamBudget,
    resetAuction,
    getCurrentPlayer,
} from "../controllers/auctionController.js";

const router = express.Router();

// Auction Management
router.put("/start/:id", startAuction);
router.post("/finish/:id", finishAuction);

router.post("/reset/:id", resetAuction);

// Player Management
router.get("/players/:id", getPlayers);
router.get("/players/all/:id", getAllPlayers);
router.get("/current-player/:id", getCurrentPlayer);

// Team Management
router.get("/teams/:id", getTournamentTeams);
router.get("/budget/:team_id", getTeamBudget);

// Bidding
router.post("/bids", placeBid);
router.post("/sell", sellPlayer);
router.post("/unsold", unsoldPlayer);

// Results
router.get("/sold/:id", getSoldPlayers);
router.get("/unsold/:id", getUnsoldPlayers);

// Status
router.get("/status/:id", getAuctionStatus);
export default router;