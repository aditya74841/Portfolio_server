import { Update } from "../model/updates.model.js";
import { Category } from "../model/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

// Create an Update
export const createUpdate = asyncHandler(async (req, res) => {
  console.log("The create Update is ")
  const { title, description, category } = req.body;
  console.log(title)
// console.log(name, description, category)
  if (!title || !category) {
    throw new ApiError(400, "Name and Category (createdBy) are required");
  }

  // Validate that the category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new ApiError(404, "Category not found");
  }

  const newUpdate = await Update.create({
    name:title,
    description,
    createdBy:category,
  });

  if (!newUpdate) {
    throw new ApiError(500, "Something went wrong while creating update");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newUpdate, "Update created successfully"));
});

// Get All Updates with Pagination
export const getAllUpdates = asyncHandler(async (req, res) => {
  // Get page and limit from query params, default to page=1, limit=10
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const updates = await Update.find()
    .populate("createdBy", "name") // Populate category name
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Optionally, send total count for frontend to know if more pages exist
  const total = await Update.countDocuments();

  return res
    .status(200)
    .json(new ApiResponse(200, { updates, total, page, limit }, "Updates fetched successfully"));
});

// Get Update By ID
export const getUpdateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const update = await Update.findById(id)
    .populate("createdBy", "name")
    // .populate("comment.commentedBy", "name email");

  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Update fetched successfully"));
});

// Update Update By ID
export const updateUpdateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, createdBy } = req.body;

  if (createdBy) {
    const categoryExists = await Category.findById(createdBy);
    if (!categoryExists) {
      throw new ApiError(404, "Provided category not found");
    }
  }

  const updatedUpdate = await Update.findByIdAndUpdate(
    id,
    { name, description, createdBy },
    { new: true }
  ).populate("createdBy", "name");

  if (!updatedUpdate) {
    throw new ApiError(404, "Update not found or update failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUpdate, "Update updated successfully"));
});

// Delete Update By ID
export const deleteUpdateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Update.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "Update not found or delete failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Update deleted successfully"));
});

// Add Comment to Update
export const addCommentToUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params; // updateId
  const { text } = req.body;

  if (!text) {
    throw new ApiError(400, "Comment text is required");
  }

  const update = await Update.findById(id);
  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  update.comment.push({
    text,
    createdAt: new Date(),
  });

  await update.save();

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Comment added successfully"));
});

export const deleteCommentFromUpdate = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;

  const update = await Update.findById(id);
  if (!update) throw new ApiError(404, "Update not found");

  // Find index of comment by ID
  const commentIndex = update.comment.findIndex(
    (c) => c._id.toString() === commentId
  );

  if (commentIndex === -1) {
    throw new ApiError(404, "Comment not found");
  }

  update.comment.splice(commentIndex, 1); // Remove comment
  await update.save();

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Comment deleted successfully"));
});



  // Add a Like
export const likeUpdate = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const update = await Update.findById(id);
    if (!update) throw new ApiError(404, "Update not found");
  
    update.like += 1;
    await update.save();
  
    return res.status(200).json(new ApiResponse(200, update, "Liked successfully"));
  });
  
  // Add a Dislike
  export const dislikeUpdate = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const update = await Update.findById(id);
    if (!update) throw new ApiError(404, "Update not found");
  
    update.dislike += 1;
    await update.save();
  
    return res.status(200).json(new ApiResponse(200, update, "Disliked successfully"));
  });