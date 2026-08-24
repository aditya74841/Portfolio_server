
import { Streak } from "./streak.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// -----------------------------
// CREATE STREAK
// -----------------------------
const createStreak = asyncHandler(async (req, res) => {
  const { name, description, targetDays = 100 } = req.body;

  if (!name) throw new ApiError(400, "Name is required");

  // Check for duplicates for THIS user
  const existing = await Streak.findOne({ name, user: req.user._id });
  if (existing) throw new ApiError(409, "You already have a streak with this name");

  // Initialize streak numbers
  const streakNumber = Array.from({ length: targetDays }, (_, i) => ({
    value: i + 1,
    completed: false,
  }));

  const streak = await Streak.create({ 
    user: req.user._id,
    name, 
    description,
    streakNumber 
  });

  return res
    .status(201)
    .json(new ApiResponse(201, streak, "Streak created successfully"));
});

// -----------------------------
// GET ALL STREAKS (For current user)
// -----------------------------
const getStreaks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  const query = { user: req.user._id };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (isActive !== undefined) query.isActive = isActive === "true";

  const streaks = await Streak.paginate(query, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, streaks, "Streaks retrieved successfully"));
});

// -----------------------------
// GET STREAK BY ID
// -----------------------------
const getStreakById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findOne({ _id: id, user: req.user._id });
  if (!streak) throw new ApiError(404, "Streak not found");

  return res
    .status(200)
    .json(new ApiResponse(200, streak, "Streak retrieved successfully"));
});

// -----------------------------
// MARK STREAK COMPLETE (TODAY)
// -----------------------------
const markStreakComplete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { streakValue, note } = req.body;

  if (!id) throw new ApiError(400, "Streak ID is required");
  if (!streakValue) throw new ApiError(400, "Streak value is required");

  const streak = await Streak.findOne({ _id: id, user: req.user._id });
  if (!streak) throw new ApiError(404, "Streak not found");
  if (!streak.isActive) throw new ApiError(400, "This streak is not active");

  // Check if it's already completed today
  if (streak.lastCompletedDate && streak.isToday(streak.lastCompletedDate)) {
    throw new ApiError(400, "You have already completed this streak today. Come back tomorrow!");
  }

  try {
    await streak.markComplete(streakValue, note || "");
    return res
      .status(200)
      .json(new ApiResponse(200, streak, "Streak marked as complete for today"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

// -----------------------------
// DELETE STREAK
// -----------------------------
const deleteStreak = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findOneAndDelete({ _id: id, user: req.user._id });
  if (!streak) throw new ApiError(404, "Streak not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Streak deleted successfully"));
});

// -----------------------------
// CHECK IF STREAK CAN BE COMPLETED TODAY
// -----------------------------
const canCompleteToday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findOne({ _id: id, user: req.user._id });
  if (!streak) throw new ApiError(404, "Streak not found");

  const canComplete =
    !streak.lastCompletedDate || !streak.isToday(streak.lastCompletedDate);

  const nextStreakValue = streak.currentStreak + 1;

  return res.status(200).json(
    new ApiResponse(200, {
      canComplete,
      currentStreak: streak.currentStreak,
      nextStreakValue,
      longestStreak: streak.longestStreak,
      lastCompletedDate: streak.lastCompletedDate,
      message: canComplete
        ? "You can complete your streak today!"
        : "Already completed today. Come back tomorrow!",
    })
  );
});

// -----------------------------
// GET STREAK STATISTICS
// -----------------------------
const getStreakStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findOne({ _id: id, user: req.user._id });
  if (!streak) throw new ApiError(404, "Streak not found");

  const totalDays = streak.streakNumber.length;
  const completedDays = streak.streakNumber.filter((d) => d.completed).length;

  const stats = {
    name: streak.name,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completionRate: streak.completionRate,
    totalDays,
    completedDays,
    lastCompletedDate: streak.lastCompletedDate,
    isActive: streak.isActive,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Streak statistics retrieved successfully"));
});

export {
  createStreak,
  getStreaks,
  getStreakById,
  markStreakComplete,
  deleteStreak,
  canCompleteToday,
  getStreakStats,
};




