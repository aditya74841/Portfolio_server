import { Router } from "express";
import {
  addTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  toggleIsComplete,
  changePriority,
  deleteTodo,
  addSubTodo,
  updateSubTodo,
  toggleSubTodoIsComplete,
  deleteSubTodo,
} from "./todo.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// Protect all Todo routes
router.use(protect);

// Main Todo routes
router.route("/").post(addTodo).get(getAllTodos);
router.route("/:id").get(getTodoById).patch(updateTodo).delete(deleteTodo);
router.route("/:id/toggle").patch(toggleIsComplete);
router.route("/:id/priority").patch(changePriority);

// Sub-todo routes
router.route("/:id/subtodos").post(addSubTodo);
router.route("/:id/subtodos/:subTodoId").patch(updateSubTodo).delete(deleteSubTodo);
router.route("/:id/subtodos/:subTodoId/toggle").patch(toggleSubTodoIsComplete);

export default router;
