import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

// ⚙️ Config
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// ✅ Connect MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
