import mongoose, { Schema } from "mongoose";

const questionTemplateSchema = new Schema(
  {
    name: {
      type: String,
      default: "Default Daily Questions",
    },
    questions: {
      type: [String], // Just the question text
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const QuestionTemplate = mongoose.model("QuestionTemplate", questionTemplateSchema);
