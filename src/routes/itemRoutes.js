import express from "express";
import {
  createItem,
  getItems,
  getItem,
} from "../controllers/itemController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// protected route
router.post("/", authMiddleware, createItem);

// public routes
router.get("/", getItems);
router.get("/:id", getItem);

export default router;