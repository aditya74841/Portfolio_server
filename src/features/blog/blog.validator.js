import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";

// Helper to validate MongoDB ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────
// Middleware: Validate Blog ID in params
// ─────────────────────────────────────────────
export const validateBlogId = (req, res, next) => {
  const { id, platformId, repurposeId } = req.params;

  if (id && !isValidObjectId(id)) {
    throw new ApiError(400, "Invalid blog ID format");
  }
  if (platformId && !isValidObjectId(platformId)) {
    throw new ApiError(400, "Invalid platform ID format");
  }
  if (repurposeId && !isValidObjectId(repurposeId)) {
    throw new ApiError(400, "Invalid repurposed content ID format");
  }

  next();
};

// ─────────────────────────────────────────────
// Middleware: Validate Create Blog payload
// ─────────────────────────────────────────────
export const validateCreateBlog = (req, res, next) => {
  const { title, status, dueDate, tags } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Blog title is required and must be a non-empty string");
  }

  const validStatuses = ["idea", "drafting", "written", "published", "archived"];
  if (status && !validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed values: ${validStatuses.join(", ")}`
    );
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    throw new ApiError(400, "Invalid due date format. Must be a valid date string");
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array of strings");
  }

  next();
};

// ─────────────────────────────────────────────
// Middleware: Validate Update Blog payload
// ─────────────────────────────────────────────
export const validateUpdateBlog = (req, res, next) => {
  const { title, status, dueDate, tags } = req.body;

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    throw new ApiError(400, "Blog title cannot be empty");
  }

  const validStatuses = ["idea", "drafting", "written", "published", "archived"];
  if (status !== undefined && !validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed values: ${validStatuses.join(", ")}`
    );
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    throw new ApiError(400, "Invalid due date format. Must be a valid date string");
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array of strings");
  }

  next();
};

// ─────────────────────────────────────────────
// Middleware: Validate Publishing Platform payload
// ─────────────────────────────────────────────
export const validatePlatformChecklist = (req, res, next) => {
  const { platformName, isPublished, publishedUrl } = req.body;

  if (isPublished !== undefined && typeof isPublished !== "boolean") {
    throw new ApiError(400, "isPublished must be a boolean");
  }

  if (publishedUrl && typeof publishedUrl !== "string") {
    throw new ApiError(400, "publishedUrl must be a string");
  }

  next();
};

export const validateAddPlatform = (req, res, next) => {
  const { platform } = req.body;

  if (!platform || typeof platform !== "string" || !platform.trim()) {
    throw new ApiError(400, "Platform name is required and must be a non-empty string");
  }

  next();
};

// ─────────────────────────────────────────────
// Middleware: Validate Repurposed Social Content payload
// ─────────────────────────────────────────────
export const validateRepurposedContent = (req, res, next) => {
  const { title, platform, contentType, status, dueDate } = req.body;

  if (req.method === "POST" && (!title || typeof title !== "string" || !title.trim())) {
    throw new ApiError(400, "Repurposed content title is required");
  }

  const validPlatforms = [
    "X (Twitter)",
    "LinkedIn",
    "Newsletter",
    "YouTube",
    "Other",
  ];
  if (platform !== undefined && !validPlatforms.includes(platform)) {
    throw new ApiError(
      400,
      `Invalid platform. Allowed values: ${validPlatforms.join(", ")}`
    );
  }

  const validContentTypes = [
    "post",
    "thread",
    "article",
    "carousel",
    "script",
  ];
  if (contentType !== undefined && !validContentTypes.includes(contentType)) {
    throw new ApiError(
      400,
      `Invalid content type. Allowed values: ${validContentTypes.join(", ")}`
    );
  }

  const validStatuses = ["todo", "drafted", "scheduled", "posted"];
  if (status !== undefined && !validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed values: ${validStatuses.join(", ")}`
    );
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    throw new ApiError(400, "Invalid due date format for social content");
  }

  next();
};
