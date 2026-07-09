import mongoose from "mongoose";
import dotenv from "dotenv";
import { Todo } from "./model/todo.model.js";
import { Update } from "./model/updates.model.js";

dotenv.config();

const migrate = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio";
    await mongoose.connect(mongoUri);
    console.log("Connected to DB.");

    const userId = "69b2f6b5374bfc2bdba38dbf";

    const todoResult = await Todo.updateMany(
      { $or: [{ user: { $exists: false } }, { user: null }] },
      { $set: { user: userId } },
    );
    console.log(`Updated ${todoResult.modifiedCount} Todos`);

    const updateResult = await Update.updateMany(
      { $or: [{ user: { $exists: false } }, { user: null }] },
      { $set: { user: userId } },
    );
    console.log(`Updated ${updateResult.modifiedCount} Updates`);

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
