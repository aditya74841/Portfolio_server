import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const techItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    motive: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["building", "deployed", "maintaining", "archived"],
      default: "building",
      required: true,
    },
    techStack: [
      {
        category: {
          type: String,
          required: true,
          trim: true,
        },
        items: [techItemSchema],
      },
    ],
    githubUrl: {
      type: String,
      trim: true,
      default: "",
    },
    liveUrl: {
      type: String,
      trim: true,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isPublic:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

// Compound index for fast lookup by user and slug
projectSchema.index({ userId: 1, slug: 1 }, { unique: true });
projectSchema.index({ userId: 1, status: 1 });

projectSchema.plugin(mongoosePaginate);

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
