import express from "express";
import {
  createUpdate,
  getAllUpdates,
  getUpdateById,
  updateTitle,
  addQuestion,
  updateQuestion,
  updateAnswer,
  deleteQuestion,
  updateMood,
  toggleIsPublic,
  updateContent,
  deleteUpdate,
  updateScreenTime,
} from "../controller/updates.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all Update routes
router.use(protect);

// Basic CRUD
router.post("/", createUpdate);
router.get("/", getAllUpdates);
router.get("/:id", getUpdateById);
router.delete("/:id", deleteUpdate);

// Specific Field Updates
router.patch("/:id/title", updateTitle);
router.patch("/:id/mood", updateMood);
router.patch("/:id/content", updateContent);
router.patch("/:id/toggle-visibility", toggleIsPublic);
router.patch("/:id/screen-time", updateScreenTime);

// QAs Operations
router.post("/:id/qa", addQuestion);
router.patch("/:id/qa/question", updateQuestion);
router.patch("/:id/qa/answer", updateAnswer);
router.delete("/:id/qa", deleteQuestion);

export default router;
