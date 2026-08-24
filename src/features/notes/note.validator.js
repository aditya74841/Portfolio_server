import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";

// Helper to validate MongoDB ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Validate Note ID parameter
 */
export const validateNoteId = (req, res, next) => {
  const { id } = req.params;

  if (id && !isValidObjectId(id)) {
    throw new ApiError(400, "Invalid note ID format");
  }

  next();
};

/**
 * Validate Create Note payload
 */
export const validateCreateNote = (req, res, next) => {
  const { title, content, category } = req.body;

  if (content === undefined || content === null || (typeof content === "string" && !content.trim())) {
    throw new ApiError(400, "Note content is required");
  }

  if (typeof content !== "string") {
    throw new ApiError(400, "Note content must be a string");
  }

  if (title !== undefined && typeof title !== "string") {
    throw new ApiError(400, "Note title must be a string");
  }

  if (category !== undefined && typeof category !== "string") {
    throw new ApiError(400, "Note category must be a string");
  }

  if (title && title.length > 500) {
    throw new ApiError(400, "Note title cannot exceed 500 characters");
  }

  if (content.length > 500000) {
    throw new ApiError(400, "Note content exceeds maximum allowed length");
  }

  next();
};

/**
 * Validate Update Note payload
 */
export const validateUpdateNote = (req, res, next) => {
  const { title, content, category } = req.body;

  if (title === undefined && content === undefined && category === undefined) {
    throw new ApiError(400, "At least one field (title, content, or category) is required to update");
  }

  if (title !== undefined && typeof title !== "string") {
    throw new ApiError(400, "Note title must be a string");
  }

  if (category !== undefined && typeof category !== "string") {
    throw new ApiError(400, "Note category must be a string");
  }

  if (title && title.length > 500) {
    throw new ApiError(400, "Note title cannot exceed 500 characters");
  }

  if (content !== undefined && typeof content !== "string") {
    throw new ApiError(400, "Note content must be a string");
  }

  if (content && content.length > 500000) {
    throw new ApiError(400, "Note content exceeds maximum allowed length");
  }

  next();
};
