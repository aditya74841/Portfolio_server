import mongoose, { Schema } from "mongoose";

const promptSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    response: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Prompt = mongoose.model("Prompt", promptSchema);
