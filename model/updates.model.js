import mongoose, { Schema } from "mongoose";


const updatesSchema = new Schema(
  {
    update: {
      type: String,
      required: [true, "Update is required"],
    },
  
  
  },
  { timestamps: true }
);

export const Update = mongoose.model("Update", updatesSchema);
