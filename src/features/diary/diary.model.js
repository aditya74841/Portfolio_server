import mongoose from "mongoose";

const diarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // Stored in YYYY-MM-DD format
      required: [true, "Date string (YYYY-MM-DD) is required"],
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    mood: {
      type: String,
      default: "Neutral",
      trim: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring one diary entry per user per day
diarySchema.index({ userId: 1, date: 1 }, { unique: true });

const Diary = mongoose.model("Diary", diarySchema);
export default Diary;
