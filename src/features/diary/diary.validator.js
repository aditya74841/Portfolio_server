import { ApiError } from "../../utils/ApiError.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{3,4}$|^\d{4}-\d{2}-\d{2}$/;

export const isValidDateString = (dateStr) => {
  if (typeof dateStr !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
};

/**
 * Validate date URL param
 */
export const validateDateParam = (req, res, next) => {
  const { date } = req.params;
  if (date && !isValidDateString(date)) {
    throw new ApiError(400, "Invalid date format. Expected YYYY-MM-DD");
  }
  next();
};

/**
 * Validate Create/Update Diary Payload
 */
export const validateDiaryPayload = (req, res, next) => {
  const { date, content, mood } = req.body;

  if (date !== undefined && !isValidDateString(date)) {
    throw new ApiError(400, "Invalid date format. Expected YYYY-MM-DD");
  }

  if (content !== undefined && typeof content !== "string") {
    throw new ApiError(400, "Diary content must be a string");
  }

  if (content && content.length > 500000) {
    throw new ApiError(400, "Diary content exceeds maximum allowed length");
  }

  if (mood !== undefined && typeof mood !== "string") {
    throw new ApiError(400, "Mood must be a string");
  }

  next();
};
