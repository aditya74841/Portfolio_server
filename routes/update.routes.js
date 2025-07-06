import express from "express";

import { protect } from "../middleware/auth.js";
import {
  addCommentToUpdate,
  createUpdate,
  deleteCommentFromUpdate,
  deleteUpdateById,
  dislikeUpdate,
  getAllUpdates,
  getUpdateById,
  likeUpdate,
  updateUpdateById,
} from "../controller/updates.controller.js";

const router = express.Router();

router.post("/", protect, createUpdate);
router.get("/", getAllUpdates);
router.get("/:id", getUpdateById);
router.put("/:id", protect, updateUpdateById);
router.delete("/:id", protect, deleteUpdateById);
router.post("/:id/comment", protect, addCommentToUpdate);
router.post("/:id/like", likeUpdate);
router.post("/:id/dislike", dislikeUpdate);
router.post("/:id/comment", addCommentToUpdate);
router.delete("/:id/comment/:commentIndex", deleteCommentFromUpdate);

export default router;
