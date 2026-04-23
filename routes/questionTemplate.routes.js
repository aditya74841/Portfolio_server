import express from "express";
import {
  createTemplate,
  getAllTemplates,
  getActiveTemplate,
  updateTemplate,
  addQuestionToTemplate,
  updateTemplateQuestion,
  deleteTemplateQuestion,
  deleteTemplate,
} from "../controller/questionTemplate.controller.js";

const router = express.Router();

// Template CRUD
router.post("/", createTemplate);
router.get("/", getAllTemplates);
router.get("/active", getActiveTemplate);
router.patch("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

// Question management within template
router.post("/:id/questions", addQuestionToTemplate);
router.patch("/:id/questions", updateTemplateQuestion); // needs index in body
router.delete("/:id/questions", deleteTemplateQuestion); // needs index in body

export default router;
