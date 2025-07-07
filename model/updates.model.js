import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const updatesSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    description: {
      type: String,
      default: "",
    },
    like: {
      type: Number,
      default: 0,
    },
    comment: {
      type: [commentSchema],
      default: [],
    },
    dislike: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Update = mongoose.model("Update", updatesSchema);
