import express from "express";

import {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
} from "../controllers/tournamentController.js";

const router = express.Router();

// CREATE
router.post("/", createTournament);

// GET ALL
router.get("/", getAllTournaments);

// GET ONE
router.get("/:id", getTournamentById);

// UPDATE
router.put("/:id", updateTournament);

// DELETE
router.delete("/:id", deleteTournament);

export default router;  