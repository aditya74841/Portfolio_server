import mongoose, { Schema } from "mongoose";

// ─────────────────────────────────────────────
// Sub-schema: Publishing platform checklist entry
// ─────────────────────────────────────────────
const publishingPlatformSchema = new Schema(
  {
    platform: {
      type: String,
      required: [true, "Platform name is required"],
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedUrl: {
      type: String,
      default: "",
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Repurposed micro-content item (X post, LinkedIn post, etc.)
// ─────────────────────────────────────────────
const repurposedContentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Content title is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: ["X (Twitter)", "LinkedIn", "Newsletter", "YouTube", "Other"],
      default: "X (Twitter)",
    },
    contentType: {
      type: String,
      enum: ["post", "thread", "article", "carousel", "script"],
      default: "post",
    },
    copyContent: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "drafted", "scheduled", "posted"],
      default: "todo",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    postUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true, timestamps: true }
);

// ─────────────────────────────────────────────
// Main Blog Schema
// ─────────────────────────────────────────────
const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["idea", "drafting", "written", "published", "archived"],
      default: "idea",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    targetAudience: {
      type: String,
      default: "",
      trim: true,
    },
    publishingChecklist: {
      type: [publishingPlatformSchema],
      default: [
        { platform: "Personal Portfolio", isPublished: false },
        { platform: "Dev.to", isPublished: false },
        { platform: "Medium", isPublished: false },
        { platform: "Hashnode", isPublished: false },
        { platform: "Substack", isPublished: false },
      ],
    },
    repurposedContent: {
      type: [repurposedContentSchema],
      default: [],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Blog owner is required"],
      index: true,
    },
  },
  { timestamps: true }
);

blogSchema.index({ owner: 1, title: 1 });

export const Blog = mongoose.model("Blog", blogSchema);
