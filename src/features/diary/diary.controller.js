import Diary from "./diary.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Helper to get formatted YYYY-MM-DD string
export const getFormattedDate = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to compute word count from HTML string
const calculateWordCount = (html = "") => {
  if (!html) return 0;
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(Boolean).length;
};

/**
 * Get or initialize Today's Diary Entry
 */
export const getTodayEntry = asyncHandler(async (req, res) => {
  const todayStr = req.query.date || getFormattedDate();

  let entry = await Diary.findOne({ userId: req.user._id, date: todayStr });

  if (!entry) {
    entry = await Diary.create({
      userId: req.user._id,
      date: todayStr,
      content: "",
      mood: "Neutral",
      wordCount: 0,
    });
  }

  return res.status(200).json(new ApiResponse(200, entry, "Today's diary entry fetched successfully"));
});

/**
 * Get Entry by Specific Date (YYYY-MM-DD)
 */
export const getEntryByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;

  let entry = await Diary.findOne({ userId: req.user._id, date });

  if (!entry) {
    // Auto-initialize entry object for requested date
    entry = await Diary.create({
      userId: req.user._id,
      date,
      content: "",
      mood: "Neutral",
      wordCount: 0,
    });
  }

  return res.status(200).json(new ApiResponse(200, entry, "Diary entry fetched successfully"));
});

/**
 * Get Range or Recent Diary Entries
 */
export const getAllEntries = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 100 } = req.query;

  const query = { userId: req.user._id };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const entries = await Diary.find(query)
    .sort({ date: -1 })
    .limit(Math.min(parseInt(limit, 10) || 100, 365));

  return res.status(200).json(new ApiResponse(200, entries, "Diary entries fetched successfully"));
});

/**
 * Create or Update (Upsert) Diary Entry for a Date
 */
export const saveOrUpdateEntry = asyncHandler(async (req, res) => {
  const dateStr = req.body.date || getFormattedDate();
  const { content, mood } = req.body;

  const wordCount = calculateWordCount(content);

  const updateFields = {
    content: content !== undefined ? content : "",
    wordCount,
  };

  if (mood !== undefined) {
    updateFields.mood = mood.trim();
  }

  const entry = await Diary.findOneAndUpdate(
    { userId: req.user._id, date: dateStr },
    { $set: updateFields },
    { new: true, upsert: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, entry, "Diary entry saved successfully"));
});

/**
 * Delete Entry by ID
 */
export const deleteEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await Diary.findOneAndDelete({ _id: id, userId: req.user._id });

  if (!entry) {
    throw new ApiError(404, "Diary entry not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Diary entry deleted successfully"));
});
