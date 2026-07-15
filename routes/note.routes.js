import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../controller/note.controller.js";

const router = express.Router();

router.use(protect); // Protect all note routes

router.route("/")
  .get(getAllNotes)
  .post(createNote);

router.route("/:id")
  .patch(updateNote)
  .delete(deleteNote);

export default router;
