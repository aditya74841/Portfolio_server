import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getTodayEntry,
  getEntryByDate,
  getAllEntries,
  saveOrUpdateEntry,
  deleteEntry,
} from "./diary.controller.js";
import {
  validateDateParam,
  validateDiaryPayload,
} from "./diary.validator.js";

const router = express.Router();

router.use(protect); // Protect all diary routes

router.get("/today", getTodayEntry);

router.route("/")
  .get(getAllEntries)
  .post(validateDiaryPayload, saveOrUpdateEntry);

router.route("/date/:date")
  .get(validateDateParam, getEntryByDate);

router.route("/:id")
  .delete(deleteEntry);

export default router;
