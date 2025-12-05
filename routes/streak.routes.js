import express from "express";
import {
  createStreak,
  getStreaks,
  getStreakById,
  markStreakComplete,
  resetCurrentStreak,
  getStreakStats,
  // getStreakCount,
  canCompleteToday,
} from "../controller/streak.controller.js";

const router = express.Router();

// -----------------------------
// Basic CRUD-lite
// -----------------------------
router.post("/", createStreak);           // Create a new streak
router.get("/", getStreaks);             // Get all streaks
// router.get("/count", getStreakCount);    // Get total streak count
router.get("/:id", getStreakById);       // Get single streak by ID

// -----------------------------
// Streak-specific operations
// -----------------------------
router.post("/:id/complete", markStreakComplete); // Mark today's streak complete
router.post("/:id/reset", resetCurrentStreak);   // Reset current streak
router.get("/:id/stats", getStreakStats);       // Get streak stats
router.get("/:id/can-complete", canCompleteToday); // Check if streak can be completed today

export default router;
