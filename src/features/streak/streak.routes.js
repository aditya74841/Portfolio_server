import express from "express";
import {
  createStreak,
  getStreaks,
  getStreakById,
  markStreakComplete,
  deleteStreak,
  getStreakStats,
  canCompleteToday,
} from "./streak.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect); // Secure all streak routes

// -----------------------------
// Basic CRUD-lite
// -----------------------------
router.post("/", createStreak);           // Create a new streak
router.get("/", getStreaks);              // Get all streaks
router.get("/:id", getStreakById);        // Get single streak by ID
router.delete("/:id", deleteStreak);      // Delete streak

// -----------------------------
// Streak-specific operations
// -----------------------------
router.post("/:id/complete", markStreakComplete); // Mark today's streak complete
router.get("/:id/stats", getStreakStats);         // Get streak stats
router.get("/:id/can-complete", canCompleteToday); // Check if streak can be completed today

export default router;
