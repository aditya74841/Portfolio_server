import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  bulkUpdateCategory,
} from "./note.controller.js";
import {
  validateNoteId,
  validateCreateNote,
  validateUpdateNote,
} from "./note.validator.js";

const router = express.Router();

router.use(protect); // Protect all note routes

router.patch("/category/bulk", bulkUpdateCategory);

router.route("/")
  .get(getAllNotes)
  .post(validateCreateNote, createNote);

router.route("/:id")
  .all(validateNoteId)
  .patch(validateUpdateNote, updateNote)
  .delete(deleteNote);

export default router;
