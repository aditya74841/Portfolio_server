import { Update } from "../model/updates.model.js";
import { QuestionTemplate } from "../model/questionTemplate.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Create a new Daily Journal Update
 * @route   POST /api/v1/updates
 */
export const createUpdate = asyncHandler(async (req, res) => {
  const { title, date } = req.body;

  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  // Check if update for this date already exists
  const existingUpdate = await Update.findOne({ date });
  if (existingUpdate) {
    throw new ApiError(400, `An update for date ${date} already exists`);
  }

  // Fetch the active question template
  const activeTemplate = await QuestionTemplate.findOne({ isActive: true });
  
  // Map template questions to the QA format (empty answers)
  const initialQas = activeTemplate 
    ? activeTemplate.questions.map(q => ({ question: q, answer: "" }))
    : [];

  const newUpdate = await Update.create({
    title: title || "Daily Journal",
    date,
    qas: initialQas,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newUpdate, "Update created successfully with template questions"));
});

/**
 * @desc    Get all updates
 * @route   GET /api/v1/updates
 */
export const getAllUpdates = asyncHandler(async (req, res) => {
  const updates = await Update.find().sort({ date: -1, createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, updates, "Updates fetched successfully"));
});

/**
 * @desc    Get update by ID
 * @route   GET /api/v1/updates/:id
 */
export const getUpdateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = await Update.findById(id);

  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Update fetched successfully"));
});

/**
 * @desc    Update only the title
 */
export const updateTitle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title) throw new ApiError(400, "Title is required");

  const update = await Update.findByIdAndUpdate(
    id,
    { $set: { title } },
    { new: true }
  );

  if (!update) throw new ApiError(404, "Update not found");

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Title updated successfully"));
});

/**
 * @desc    Add a new Question and Answer
 */
export const addQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  if (!question) throw new ApiError(400, "Question is required");

  const update = await Update.findByIdAndUpdate(
    id,
    { $push: { qas: { question, answer } } },
    { new: true }
  );

  if (!update) throw new ApiError(404, "Update not found");

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Question added successfully"));
});

/**
 * @desc    Update a specific question in the qas array (by index)
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { index, question } = req.body;

  if (index === undefined || !question) {
    throw new ApiError(400, "Index and question are required");
  }

  const update = await Update.findById(id);
  if (!update) throw new ApiError(404, "Update not found");

  if (!update.qas[index]) throw new ApiError(400, "Invalid QA index");

  update.qas[index].question = question;
  await update.save();

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Question updated successfully"));
});

/**
 * @desc    Update a specific answer in the qas array (by index)
 */
export const updateAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { index, answer } = req.body;

  if (index === undefined) {
    throw new ApiError(400, "Index is required");
  }

  const update = await Update.findById(id);
  if (!update) throw new ApiError(404, "Update not found");

  if (!update.qas[index]) throw new ApiError(400, "Invalid QA index");

  update.qas[index].answer = answer;
  await update.save();

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Answer updated successfully"));
});

/**
 * @desc    Delete a question from the qas array (by index)
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;

  if (index === undefined) throw new ApiError(400, "Index is required");

  const update = await Update.findById(id);
  if (!update) throw new ApiError(404, "Update not found");

  update.qas.splice(index, 1);
  await update.save();

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Question deleted successfully"));
});

/**
 * @desc    Update the mood
 */
export const updateMood = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mood } = req.body;

  if (!mood) throw new ApiError(400, "Mood is required");

  const update = await Update.findByIdAndUpdate(
    id,
    { $set: { mood } },
    { new: true, runValidators: true }
  );

  if (!update) throw new ApiError(404, "Update not found");

  return res
    .status(200)
    .json(new ApiResponse(200, update, "Mood updated successfully"));
});

/**
 * @desc    Toggle isPublic status
 */
export const toggleIsPublic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const update = await Update.findById(id);
  if (!update) throw new ApiError(404, "Update not found");

  update.isPublic = !update.isPublic;
  await update.save();

  return res
    .status(200)
    .json(new ApiResponse(200, update, `Update is now ${update.isPublic ? "Public" : "Private"}`));
});

/**
 * @desc    Update the main 'update' text content
 */
export const updateContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { update: updateText } = req.body;

  if (!updateText) throw new ApiError(400, "Update text is required");

  const updatedUpdate = await Update.findByIdAndUpdate(
    id,
    { $set: { update: updateText } },
    { new: true }
  );

  if (!updatedUpdate) throw new ApiError(404, "Update not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUpdate, "Update content updated successfully"));
});

/**
 * @desc    Delete the entire update
 */
export const deleteUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Update.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Update not found");

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Update deleted successfully"));
});
