import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  togglePublishingPlatform,
  addCustomPlatform,
  deleteCustomPlatform,
  addRepurposedContent,
  updateRepurposedContent,
  deleteRepurposedContent,
  getTodayBlogTasks,
} from "./blog.controller.js";
import {
  validateBlogId,
  validateCreateBlog,
  validateUpdateBlog,
  validatePlatformChecklist,
  validateAddPlatform,
  validateRepurposedContent,
} from "./blog.validator.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// ── Command Center Tasks ─────────────────────
router.get("/today-tasks", getTodayBlogTasks);

// ── Core Blog CRUD ───────────────────────────
router.get("/", getAllBlogs);
router.post("/", validateCreateBlog, createBlog);
router.get("/:id", validateBlogId, getBlogById);
router.put("/:id", validateBlogId, validateUpdateBlog, updateBlog);
router.delete("/:id", validateBlogId, deleteBlog);

// ── Multi-Platform Checklist Management ──────
router.patch("/:id/checklist", validateBlogId, validatePlatformChecklist, togglePublishingPlatform);
router.post("/:id/checklist/platform", validateBlogId, validateAddPlatform, addCustomPlatform);
router.delete("/:id/checklist/platform/:platformId", validateBlogId, deleteCustomPlatform);

// ── Content Repurposing (Micro-content) ───────
router.post("/:id/repurpose", validateBlogId, validateRepurposedContent, addRepurposedContent);
router.put("/:id/repurpose/:repurposeId", validateBlogId, validateRepurposedContent, updateRepurposedContent);
router.delete("/:id/repurpose/:repurposeId", validateBlogId, deleteRepurposedContent);

export default router;
