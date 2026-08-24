import Note from "./note.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAllNotes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 2000);
  const skip = (page - 1) * limit;

  const query = { userId: req.user._id };
  if (req.query.category) {
    query.category = req.query.category.trim();
  }

  const notes = await Note.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

export const createNote = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;
  const note = await Note.create({
    title: title ? title.trim() : "",
    content: content || "",
    category: category ? category.trim() : "General",
    userId: req.user._id,
  });
  return res.status(201).json(new ApiResponse(201, note, "Note created successfully"));
});

export const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  const updateFields = {};
  if (title !== undefined) updateFields.title = typeof title === "string" ? title.trim() : title;
  if (content !== undefined) updateFields.content = content;
  if (category !== undefined) updateFields.category = typeof category === "string" ? category.trim() : category;

  const note = await Note.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    updateFields,
    { new: true, runValidators: true }
  );

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  return res.status(200).json(new ApiResponse(200, note, "Note updated successfully"));
});

export const bulkUpdateCategory = asyncHandler(async (req, res) => {
  const { oldCategory, newCategory } = req.body;

  if (!oldCategory || !newCategory) {
    throw new ApiError(400, "Both oldCategory and newCategory are required");
  }

  const result = await Note.updateMany(
    { userId: req.user._id, category: oldCategory.trim() },
    { category: newCategory.trim() }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { modifiedCount: result.modifiedCount },
      `Bulk updated ${result.modifiedCount} notes from "${oldCategory}" to "${newCategory}"`
    )
  );
});

export const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = await Note.findOneAndDelete({ _id: id, userId: req.user._id });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Note deleted successfully"));
});
