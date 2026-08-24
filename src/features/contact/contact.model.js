import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

contactSchema.plugin(mongoosePaginate);

export const Contact = mongoose.model("Contact", contactSchema);
