import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ProjectService } from "./services/project.service.js";
import { ProjectEntryService } from "./services/projectEntry.service.js";

// ==========================================
// PROJECT CONTROLLERS
// ==========================================

export const createProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.createProject({
    userId: req.user._id,
    ...req.body,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created successfully"));
});

export const getProjects = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const result = await ProjectService.getProjects({
    userId: req.user._id,
    status,
    search,
    page,
    limit,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Projects retrieved successfully"));
});

export const getProjectBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const project = await ProjectService.getProjectBySlug(slug, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project retrieved successfully"));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await ProjectService.getProjectById(id, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project retrieved successfully"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await ProjectService.updateProject(id, req.user._id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ProjectService.deleteProject(id, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Project deleted successfully"));
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const project = await ProjectService.updateProjectStatus(id, req.user._id, status);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project status updated successfully"));
});

export const addTechCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  const project = await ProjectService.addTechCategory(id, req.user._id, category);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Tech category added successfully"));
});

export const removeTechCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  const project = await ProjectService.removeTechCategory(id, req.user._id, category);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Tech category removed successfully"));
});

export const addTechItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, item } = req.body;
  const project = await ProjectService.addTechItem(id, req.user._id, category, item);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Tech item added successfully"));
});

export const removeTechItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, itemName } = req.body;
  const project = await ProjectService.removeTechItem(id, req.user._id, category, itemName);
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Tech item removed successfully"));
});

// ==========================================
// PROJECT ENTRY CONTROLLERS
// ==========================================

export const createProjectEntry = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const entry = await ProjectEntryService.createProjectEntry({
    projectId,
    userId: req.user._id,
    ...req.body,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, entry, "Project entry created successfully"));
});

export const getProjectEntries = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { type, isPublic, page, limit } = req.query;
  const result = await ProjectEntryService.getProjectEntries({
    projectId,
    userId: req.user._id,
    type,
    isPublic,
    page,
    limit,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Project entries retrieved successfully"));
});

export const getProjectEntryById = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const entry = await ProjectEntryService.getProjectEntryById(entryId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, entry, "Project entry retrieved successfully"));
});

export const updateProjectEntry = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const entry = await ProjectEntryService.updateProjectEntry(entryId, req.user._id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, entry, "Project entry updated successfully"));
});

export const deleteProjectEntry = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const result = await ProjectEntryService.deleteProjectEntry(entryId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Project entry deleted successfully"));
});

export const changeEntryVisibility = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const { isPublic } = req.body;
  const entry = await ProjectEntryService.changeIsPublic(entryId, req.user._id, isPublic);
  return res
    .status(200)
    .json(new ApiResponse(200, entry, "Project entry visibility updated successfully"));
});

export const addEntryTags = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const { tags } = req.body;
  const entry = await ProjectEntryService.addEntryTags(entryId, req.user._id, tags);
  return res
    .status(200)
    .json(new ApiResponse(200, entry, "Tags added successfully"));
});

export const removeEntryTag = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const { tag } = req.body;
  const entry = await ProjectEntryService.removeEntryTag(entryId, req.user._id, tag);
  return res
    .status(200)
    .json(new ApiResponse(200, entry, "Tag removed successfully"));
});
