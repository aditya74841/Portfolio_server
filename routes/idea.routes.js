import express from "express";

import {
  addIdeaUpdate,
  changeIdeaStatus,
  createIdea,
  deleteIdea,
  deleteIdeaUpdate,
  getIdeaById,
  listIdeas,
  updateIdea,
  updateIdeaUpdate,
} from "../controller/idea.controller.js";

import { adminOnly, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createIdea);
router.get("/", listIdeas);
router.get("/:id", getIdeaById);
router.patch("/:id", updateIdea);
router.delete("/:id", deleteIdea);
router.patch("/:id/status", changeIdeaStatus);

router.post("/:id/updates", addIdeaUpdate);
router.patch("/:id/updates/:updateId", updateIdeaUpdate);
router.delete("/:id/updates/:updateId", deleteIdeaUpdate);

export default router;

