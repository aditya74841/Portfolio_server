import { Idea } from "../model/idea.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createIdea = asyncHandler(async (req, res) => {
  console.log("createIdea hit");
  const { title, description, status } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const owner = req.user?._id;
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const existing = await Idea.findOne({ owner, title: title.trim() });
  if (existing) {
    throw new ApiError(409, "Idea with this title already exists");
  }

  const idea = await Idea.create({
    title,
    description,
    status,
    owner,
  });

  return res.status(201).json(new ApiResponse(201, idea, "Idea created successfully"));
});

export const listIdeas = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const ideas = await Idea.find({ owner }).sort({ updatedAt: -1, createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { ideas }, "Ideas fetched successfully"));
});

export const getIdeaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?._id;

  if (!id) {
    throw new ApiError(400, "Idea ID is required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const idea = await Idea.findOne({ _id: id, owner });
  if (!idea) {
    throw new ApiError(404, "Idea not found");
  }

  return res.status(200).json(new ApiResponse(200, idea, "Idea fetched successfully"));
});

export const updateIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?._id;
  const { title, description, status } = req.body;

  if (!id) {
    throw new ApiError(400, "Idea ID is required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  if (!title && !description && !status) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const existing = await Idea.findOne({ _id: id, owner });
  if (!existing) {
    throw new ApiError(404, "Idea not found");
  }

  if (title && title.trim() !== existing.title) {
    const dup = await Idea.findOne({ owner, title: title.trim() });
    if (dup) {
      throw new ApiError(409, "Idea with this title already exists");
    }
  }

  const updated = await Idea.findOneAndUpdate(
    { _id: id, owner },
    {
      ...(title && { title }),
      ...(description && { description }),
      ...(status && { status }),
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new ApiError(500, "Something went wrong while updating idea");
  }

  return res.status(200).json(new ApiResponse(200, updated, "Idea updated successfully"));
});

export const addIdeaUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?._id;
  const { description, links } = req.body;

  if (!id) {
    throw new ApiError(400, "Idea ID is required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }
  if (!description) {
    throw new ApiError(400, "Update description is required");
  }

  const idea = await Idea.findOne({ _id: id, owner });
  if (!idea) {
    throw new ApiError(404, "Idea not found");
  }

  idea.updates.unshift({
    description,
    links: Array.isArray(links) ? links : [],
    createdAt: new Date(),
  });

  await idea.save();

  return res.status(200).json(new ApiResponse(200, idea, "Update added successfully"));
});

export const deleteIdeaUpdate = asyncHandler(async (req, res) => {
  const { id, updateId } = req.params;
  const owner = req.user?._id;

  if (!id || !updateId) {
    throw new ApiError(400, "Idea ID and update ID are required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const idea = await Idea.findOne({ _id: id, owner });
  if (!idea) {
    throw new ApiError(404, "Idea not found");
  }

  const idx = idea.updates.findIndex((u) => u._id.toString() === updateId);
  if (idx === -1) {
    throw new ApiError(404, "Update not found");
  }

  idea.updates.splice(idx, 1);
  await idea.save();

  return res.status(200).json(new ApiResponse(200, idea, "Update deleted successfully"));
});

export const deleteIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?._id;

  if (!id) {
    throw new ApiError(400, "Idea ID is required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const idea = await Idea.findOneAndDelete({ _id: id, owner });
  if (!idea) {
    throw new ApiError(404, "Idea not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Idea deleted successfully"));
});

export const changeIdeaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const owner = req.user?._id;

  if (!id || !status) {
    throw new ApiError(400, "Idea ID and status are required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const idea = await Idea.findOneAndUpdate(
    { _id: id, owner },
    { status },
    { new: true, runValidators: true }
  );

  if (!idea) {
    throw new ApiError(404, "Idea not found");
  }

  return res.status(200).json(new ApiResponse(200, idea, "Status updated successfully"));
});

export const updateIdeaUpdate = asyncHandler(async (req, res) => {
  const { id, updateId } = req.params;
  const { description, links } = req.body;
  const owner = req.user?._id;

  if (!id || !updateId) {
    throw new ApiError(400, "Idea ID and update ID are required");
  }
  if (!owner) {
    throw new ApiError(401, "Not authorized");
  }

  const idea = await Idea.findOne({ _id: id, owner });
  if (!idea) {
    throw new ApiError(404, "Idea not found");
  }

  const update = idea.updates.id(updateId);
  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  if (description) update.description = description;
  if (links) update.links = Array.isArray(links) ? links : update.links;

  await idea.save();

  return res.status(200).json(new ApiResponse(200, idea, "Update modified successfully"));
});

