import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// 🗂️ Your Imports
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
import todoRouter from "./routes/todo.routes.js";
import noteRouter from "./routes/note.routes.js";

// --------------------------------------------------------------------
// 🚀 App Initialization
// --------------------------------------------------------------------

const app = express();
app.use(express.json());
app.use(cookieParser());
// We assume we might need cookies, but for now we won't strictly require cookie-parser to run
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow all origins for now to debug production issues
    callback(null, true);
  },
  credentials: true 
}));

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
app.use("/api/v1/todo", todoRouter);
app.use("/api/v1/notes", noteRouter);

app.get("/", (req, res) => res.send("<h1>Aditya's AI Assistant (Gemini + LangChain)</h1>"));
app.get("/health-check", (req, res) => res.status(200).json({ success: true }));

app.use(errorHandler);

export default app;
