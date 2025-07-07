import express from "express";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  getCategoryCount,
  updateCategory,
} from "../controller/category.controller.js";

const router = express.Router();

// router.get("/category-count", getCategoryCount);
router.post("/", createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
