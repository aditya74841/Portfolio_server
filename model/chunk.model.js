import mongoose, { Schema } from "mongoose";

const chunkSchema = new Schema(
  {
    chunkId: {
      type: String,
      required: [true, "Chunk ID is required"],
      unique: true,
    },
    content: {
      type: String,
      required: [true, "Chunk content is required"],
    },
    embedding: {
      type: [Number],
      required: true,
      index: {
        type: "vectorSearch"
      }
    },
    metadata: {
      category: {
        type: String,
        required: true,
        enum: ["bio", "skills", "projects", "experience", "education", "contact"],
      },
      source: {
        type: String,
        required: true,
      },
      tags: {
        type: [String],
        default: [],
      },
      title: {
        type: String,
        required: true,
      },
      chunkIndex: {
        type: Number,
        required: true,
      }
    }
  },
  { 
    timestamps: true 
  }
);

// Create vector search index
// Note: This requires MongoDB Atlas with vector search enabled
chunkSchema.index(
  { embedding: "vectorSearch" },
  {
    name: "vector_index",
    options: {
      numDimensions: 384, // for MiniLM-L6-v2
      similarity: "cosine"
    }
  }
);

export const Chunk = mongoose.model("Chunk", chunkSchema);