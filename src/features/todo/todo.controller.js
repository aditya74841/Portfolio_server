import { Todo } from "./todo.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * @desc    Add a new Todo
 * @route   POST /api/v1/todos
 */
export const addTodo = asyncHandler(async (req, res) => {
  const { title, description, priority, dueDate } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  const todo = await Todo.create({
    user: req.user._id,
    title,
    description: description || "",
    priority: priority || "medium",
    dueDate,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, todo, "Todo added successfully"));
});

/**
 * @desc    Get all Todos
 * @route   GET /api/v1/todos
 */
export const getAllTodos = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, todos, "Todos fetched successfully"));
});

/**
 * @desc    Get Todo by ID
 * @route   GET /api/v1/todos/:id
 */
export const getTodoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const todo = await Todo.findOne({ _id: id, user: req.user._id });

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo fetched successfully"));
});

/**
 * @desc    Update Todo
 * @route   PATCH /api/v1/todos/:id
 */
export const updateTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, isCompleted, priority, dueDate } = req.body;

  const todo = await Todo.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { 
      $set: { 
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate }),
      } 
    },
    { new: true, runValidators: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo updated successfully"));
});

/**
 * @desc    Toggle Todo isCompleted status
 * @route   PATCH /api/v1/todos/:id/toggle
 */
export const toggleIsComplete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const todo = await Todo.findOne({ _id: id, user: req.user._id });
  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  todo.isCompleted = !todo.isCompleted;
  await todo.save();

  return res
    .status(200)
    .json(new ApiResponse(200, todo, `Todo marked as ${todo.isCompleted ? "completed" : "incomplete"}`));
});

/**
 * @desc    Change Todo priority
 * @route   PATCH /api/v1/todos/:id/priority
 */
export const changePriority = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority || !["low", "medium", "high"].includes(priority)) {
    throw new ApiError(400, "Valid priority (low, medium, high) is required");
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $set: { priority } },
    { new: true, runValidators: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Priority updated successfully"));
});

/**
 * @desc    Delete Todo
 * @route   DELETE /api/v1/todos/:id
 */
export const deleteTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedTodo = await Todo.findOneAndDelete({ _id: id, user: req.user._id });

  if (!deletedTodo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTodo, "Todo deleted successfully"));
});

/**
 * @desc    Add a Sub-todo to a Todo
 * @route   POST /api/v1/todos/:id/subtodos
 */
export const addSubTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title) {
    throw new ApiError(400, "Sub-todo title is required");
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { 
      $push: { 
        subTodos: { 
          title, 
          description: description || "",
          isCompleted: false
        } 
      } 
    },
    { new: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Sub-todo added successfully"));
});

/**
 * @desc    Update a specific Sub-todo
 * @route   PATCH /api/v1/todos/:id/subtodos/:subTodoId
 */
export const updateSubTodo = asyncHandler(async (req, res) => {
  const { id, subTodoId } = req.params;
  const { title, description, isCompleted } = req.body;

  const updateFields = {};
  if (title) updateFields["subTodos.$.title"] = title;
  if (description !== undefined) updateFields["subTodos.$.description"] = description;
  if (isCompleted !== undefined) updateFields["subTodos.$.isCompleted"] = isCompleted;

  const todo = await Todo.findOneAndUpdate(
    { _id: id, user: req.user._id, "subTodos._id": subTodoId },
    { $set: updateFields },
    { new: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo or Sub-todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Sub-todo updated successfully"));
});

/**
 * @desc    Toggle Sub-todo isCompleted status
 * @route   PATCH /api/v1/todos/:id/subtodos/:subTodoId/toggle
 */
export const toggleSubTodoIsComplete = asyncHandler(async (req, res) => {
  const { id, subTodoId } = req.params;

  const todo = await Todo.findOne({ _id: id, user: req.user._id });
  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  const subTodo = todo.subTodos.id(subTodoId);
  if (!subTodo) {
    throw new ApiError(404, "Sub-todo not found");
  }

  subTodo.isCompleted = !subTodo.isCompleted;
  await todo.save();

  return res
    .status(200)
    .json(new ApiResponse(200, todo, `Sub-todo marked as ${subTodo.isCompleted ? "completed" : "incomplete"}`));
});

/**
 * @desc    Delete a specific Sub-todo
 * @route   DELETE /api/v1/todos/:id/subtodos/:subTodoId
 */
export const deleteSubTodo = asyncHandler(async (req, res) => {
  const { id, subTodoId } = req.params;

  const todo = await Todo.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $pull: { subTodos: { _id: subTodoId } } },
    { new: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Sub-todo deleted successfully"));
});
