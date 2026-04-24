import "dotenv/config";

import express from "express";
import fs, { existsSync, readFileSync, writeFileSync } from "fs";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
// dotenv.config();
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import crypto from "crypto";


// 🗂️ Your Imports
import { Prompt } from "./model/prompt.model.js";
import { errorHandler } from "./middlewares/error.middlewares.js";
import categoryRouter from "./routes/category.routes.js";
import updateRouter from "./routes/update.routes.js";
import contactRouter from "./routes/contact.routes.js";
import streakRouter from "./routes/streak.routes.js";
import aiRouter from "./routes/ai.routes.js";
import projectRouter from "./routes/project.routes.js";
import authRouter from "./routes/auth.routes.js";
import ideaRouter from "./routes/idea.routes.js";
import questionTemplateRouter from "./routes/questionTemplate.routes.js";

// --------------------------------------------------------------------
// 🚀 App Initialization
// --------------------------------------------------------------------

const app = express();
app.use(express.json());
// We assume we might need cookies, but for now we won't strictly require cookie-parser to run
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow all origins for now to debug production issues
    callback(null, true);
  },
  credentials: true 
}));

// ⚙️ Config
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

// ✅ Connect MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// 🔒 Rate Limiting
const askLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many AI questions from this IP. Please wait before retrying.",
  },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
};



// --------------------------------------------------------------------
// 🌐 Routes and Health
// --------------------------------------------------------------------
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/update", updateRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/streak", streakRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/idea", ideaRouter);
app.use("/api/v1/template", questionTemplateRouter);

app.get("/", (req, res) => res.send("<h1>Aditya’s AI Assistant (Gemini + LangChain)</h1>"));
app.get("/health-check", (req, res) => res.status(200).json({ success: true }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
