import mongoose, { Schema } from "mongoose";

const qaSchema = new Schema(
  {
    question: String,
    answer: String,
  },
  { _id: false },
);

const updatesSchema = new Schema(
  {
    title: {
      type: String,
      default: "Daily Journal",
    },

    date: {
      type: String, // "2026-04-23"
      required: true,
      unique: true, // 🔥 ensures one entry per day
    },

    qas: {
      type: [qaSchema],
      default: [],
    },

    update: String,

    mood: {
      type: String,
      enum: ["great", "good", "okay", "bad"],
      default: "good",
    },

    why: {
      type: String,
      default: "",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    screenTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
      note: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const Update = mongoose.model("Update", updatesSchema);
