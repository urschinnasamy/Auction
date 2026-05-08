import express from "express";

import {
  getPlayers,
  createNewPlayer,
  updateExistingPlayer,
  deleteExistingPlayer,
  deleteAllPlayersController,
  bulkUploadPlayersController,
} from "../controllers/playerController.js";

const router = express.Router();

// GET
router.get("/", getPlayers);

// CREATE
router.post("/", createNewPlayer);

// DELETE ALL  ✅ MUST COME FIRST
router.delete("/all", deleteAllPlayersController);

// BULK
router.post("/bulk", bulkUploadPlayersController);

// UPDATE
router.put("/:id", updateExistingPlayer);

// DELETE SINGLE
router.delete("/:id", deleteExistingPlayer);

export default router;