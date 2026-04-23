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
} from "../controller/updates.controller.js";

const router = express.Router();

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

// QAs Operations
router.post("/:id/qa", addQuestion);
router.patch("/:id/qa/question", updateQuestion);
router.patch("/:id/qa/answer", updateAnswer);
router.delete("/:id/qa", deleteQuestion);

export default router;
