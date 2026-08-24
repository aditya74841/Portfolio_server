import mongoose, { Schema } from "mongoose";

const projectEntrySchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["update", "difficulty", "learning", "milestone"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { timestamps: true }
);

// Indexes for fast timeline filtering by status, entry type, and creation date
projectEntrySchema.index({ projectId: 1, isPublic: 1, createdAt: -1 });
projectEntrySchema.index({ projectId: 1, type: 1, isPublic: 1, createdAt: -1 });

export const ProjectEntry = mongoose.models.ProjectEntry || mongoose.model("ProjectEntry", projectEntrySchema);
