import express from "express";

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

router.post("/", createUpdate);
// GET /updates?page=1&limit=10 - Fetch updates with pagination (page and limit are optional, default to 1 and 10)
router.get("/", getAllUpdates);
router.get("/:id", getUpdateById);
router.put("/:id", updateUpdateById);
router.delete("/:id", deleteUpdateById);
router.post("/:id/comment", addCommentToUpdate);
router.get("/:id/like", likeUpdate);
router.get("/:id/dislike", dislikeUpdate);
router.delete("/:id/comment/:commentId", deleteCommentFromUpdate);

export default router;
