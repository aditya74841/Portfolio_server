import Note from "../model/note.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

export const createNote = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const note = await Note.create({
    content: content || "",
    userId: req.user._id,
  });
  return res.status(201).json(new ApiResponse(201, note, "Note created successfully"));
});

export const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  const note = await Note.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { content },
    { new: true, runValidators: true }
  );
  
  if (!note) {
    throw new ApiError(404, "Note not found");
  }
  
  return res.status(200).json(new ApiResponse(200, note, "Note updated successfully"));
});

export const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = await Note.findOneAndDelete({ _id: id, userId: req.user._id });
  
  if (!note) {
    throw new ApiError(404, "Note not found");
  }
  
  return res.status(200).json(new ApiResponse(200, null, "Note deleted successfully"));
});
