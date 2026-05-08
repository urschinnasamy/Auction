import express from "express";

import {
  createTeam,
  getTeamsByTournament,
  deleteTeam,
  getTeamById,
  getTeamBudget,
  getAllTeamsWithBudget,
} from "../controllers/teamController.js";

const router = express.Router();

// CREATE TEAM
router.post("/", createTeam);

// GET TEAMS BY TOURNAMENT
router.get("/", getTeamsByTournament);

// GET ALL TEAMS WITH BUDGET FOR TOURNAMENT
router.get("/tournament/:tournament_id/budget", getAllTeamsWithBudget);

// GET TEAM BY ID
router.get("/:id", getTeamById);

// GET TEAM BUDGET
router.get("/:id/budget", getTeamBudget);

// DELETE TEAM
router.delete("/:id", deleteTeam);

export default router;