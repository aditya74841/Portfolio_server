import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

categorySchema.plugin(mongoosePaginate);

export const Category = mongoose.model("Category", categorySchema);
