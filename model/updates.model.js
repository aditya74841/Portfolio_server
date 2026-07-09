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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Daily Journal",
    },

    date: {
      type: String, // "2026-04-23"
      required: true,
      // Removed unique: true here to allow multiple users to have an update on the same date
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

// Ensures one entry per user per day
updatesSchema.index({ user: 1, date: 1 }, { unique: true });

export const Update = mongoose.model("Update", updatesSchema);
