import express from "express";

import {
  addIdeaUpdate,
  createIdea,
  deleteIdeaUpdate,
  getIdeaById,
  listIdeas,
  updateIdea,
} from "../controller/idea.controller.js";

import { adminOnly, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.post("/", createIdea);
router.get("/", listIdeas);
router.get("/:id", getIdeaById);
router.patch("/:id", updateIdea);
router.post("/:id/updates", addIdeaUpdate);
router.delete("/:id/updates/:updateId", deleteIdeaUpdate);

export default router;

