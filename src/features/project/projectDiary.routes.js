import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  createProject,
  getProjects,
  getProjectBySlug,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
  addTechCategory,
  removeTechCategory,
  addTechItem,
  removeTechItem,
  createProjectEntry,
  getProjectEntries,
  getProjectEntryById,
  updateProjectEntry,
  deleteProjectEntry,
  changeEntryVisibility,
  addEntryTags,
  removeEntryTag,
} from "./projectDiary.controller.js";

const router = Router();

// Protect all project diary routes
router.use(protect);

// ------------------------------------------
// Project Routes
// ------------------------------------------
router.route("/")
  .post(createProject)
  .get(getProjects);

router.route("/slug/:slug")
  .get(getProjectBySlug);

router.route("/:id")
  .get(getProjectById)
  .patch(updateProject)
  .delete(deleteProject);

router.route("/:id/status")
  .patch(updateProjectStatus);

router.route("/:id/tech-categories")
  .post(addTechCategory)
  .delete(removeTechCategory);

router.route("/:id/tech-items")
  .post(addTechItem)
  .delete(removeTechItem);

// ------------------------------------------
// Project Timeline Entry Routes
// ------------------------------------------
router.route("/:projectId/entries")
  .post(createProjectEntry)
  .get(getProjectEntries);

router.route("/entries/:entryId")
  .get(getProjectEntryById)
  .patch(updateProjectEntry)
  .delete(deleteProjectEntry);

router.route("/entries/:entryId/visibility")
  .patch(changeEntryVisibility);

router.route("/entries/:entryId/tags")
  .post(addEntryTags)
  .delete(removeEntryTag);

export default router;
