import mongoose, { Schema } from "mongoose";

const subTodoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Sub-todo title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const todoSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Todo title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    subTodos: {
      type: [subTodoSchema],
      default: [],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries per user
todoSchema.index({ user: 1, createdAt: -1 });

export const Todo = mongoose.model("Todo", todoSchema);
