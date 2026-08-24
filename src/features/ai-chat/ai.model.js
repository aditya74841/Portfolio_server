import mongoose, { Schema } from "mongoose";

const aiSchema = new Schema(
  {

    messages: [
      {
        _id: false,
        role: {
          type: String,
        },
        content: {
          type: String,
        },
      },
    ],
    token: {
      type: String,
    },
    modelname: {
      type: String,
    },
    systemMessage: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Ai = mongoose.model("Ai", aiSchema);
