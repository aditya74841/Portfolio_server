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
} from "../controller/todo.controller.js";

const router = Router();

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
