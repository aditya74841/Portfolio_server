import { QuestionTemplate } from "./questionTemplate.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * @desc    Create a new Question Template
 */
export const createTemplate = asyncHandler(async (req, res) => {
  const { name, questions } = req.body;

  const template = await QuestionTemplate.create({
    name: name || "Daily Template",
    questions: questions || [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, template, "Template created successfully"));
});

/**
 * @desc    Get all templates
 */
export const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = await QuestionTemplate.find();
  return res
    .status(200)
    .json(new ApiResponse(200, templates, "Templates fetched successfully"));
});

/**
 * @desc    Get the active template
 */
export const getActiveTemplate = asyncHandler(async (req, res) => {
  const template = await QuestionTemplate.findOne({ isActive: true });
  if (!template) {
    throw new ApiError(404, "No active template found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, template, "Active template fetched successfully"));
});

/**
 * @desc    Update template name or status
 */
export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, isActive } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (isActive !== undefined) updateFields.isActive = isActive;

  const template = await QuestionTemplate.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true }
  );

  if (!template) throw new ApiError(404, "Template not found");

  return res
    .status(200)
    .json(new ApiResponse(200, template, "Template updated successfully"));
});

/**
 * @desc    Add a question to a template
 */
export const addQuestionToTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;

  if (!question) throw new ApiError(400, "Question is required");

  const template = await QuestionTemplate.findByIdAndUpdate(
    id,
    { $push: { questions: question } },
    { new: true }
  );

  if (!template) throw new ApiError(404, "Template not found");

  return res
    .status(200)
    .json(new ApiResponse(200, template, "Question added to template"));
});

/**
 * @desc    Update a question in a template (by index)
 */
export const updateTemplateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { index, question } = req.body;

  if (index === undefined || !question) {
    throw new ApiError(400, "Index and question are required");
  }

  const template = await QuestionTemplate.findById(id);
  if (!template) throw new ApiError(404, "Template not found");

  if (!template.questions || template.questions[index] === undefined) {
    throw new ApiError(400, "Invalid question index");
  }

  // Use .set() to ensure Mongoose detects the array change
  template.questions.set(index, question);
  await template.save();

  return res
    .status(200)
    .json(new ApiResponse(200, template, "Template question updated"));
});

/**
 * @desc    Delete a question from a template (by index)
 */
export const deleteTemplateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;

  if (index === undefined) throw new ApiError(400, "Index is required");

  const template = await QuestionTemplate.findById(id);
  if (!template) throw new ApiError(404, "Template not found");

  template.questions.splice(index, 1);
  await template.save();

  return res
    .status(200)
    .json(new ApiResponse(200, template, "Template question deleted"));
});

/**
 * @desc    Delete entire template
 */
export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await QuestionTemplate.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Template not found");

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Template deleted successfully"));
});
