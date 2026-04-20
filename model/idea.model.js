import mongoose, { Schema } from "mongoose";

const ideaUpdateSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, "Update description is required"],
      trim: true,
    },
    links: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ideaSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Idea title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Idea description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["idea", "researching", "building", "shipped", "paused"],
      default: "idea",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Idea owner is required"],
      index: true,
    },
    updates: {
      type: [ideaUpdateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ideaSchema.index({ owner: 1, title: 1 }, { unique: true });

export const Idea = mongoose.model("Idea", ideaSchema);
