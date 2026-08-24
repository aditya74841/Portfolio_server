import express from "express";
import { chatController, getMessagesController } from "./ai.controller.js";

const router = express.Router();

// router.get("/category-count", getCategoryCount);
router.get("/chat/:id", getMessagesController);
router.post("/chat", chatController);

export default router;
