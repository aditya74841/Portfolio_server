import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// ── Shared middleware ──────────────────────────────────────────────
import { errorHandler } from "./src/middlewares/error.middlewares.js";

// ── Feature routes ─────────────────────────────────────────────────
import authRouter         from "./src/features/auth/auth.routes.js";
import ideaRouter         from "./src/features/idea/idea.routes.js";
import projectRouter      from "./src/features/project/project.routes.js";
import projectDiaryRouter from "./src/features/project/projectDiary.routes.js";
import todoRouter         from "./src/features/todo/todo.routes.js";
import noteRouter         from "./src/features/notes/note.routes.js";
import streakRouter       from "./src/features/streak/streak.routes.js";
import updateRouter       from "./src/features/updates/update.routes.js";
import contactRouter      from "./src/features/contact/contact.routes.js";
import aiRouter           from "./src/features/ai-chat/ai.routes.js";
import categoryRouter     from "./src/features/ai-chat/category.routes.js";
import questionTemplateRouter from "./src/features/ai-chat/questionTemplate.routes.js";
import blogRouter             from "./src/features/blog/blog.routes.js";
import diaryRouter            from "./src/features/diary/diary.routes.js";

// ── App init ───────────────────────────────────────────────────────
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────────────
const askLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: "Too many AI questions from this IP. Please wait before retrying." },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

// ── Routes ─────────────────────────────────────────────────────────
app.use("/api/v1/auth",         authRouter);
app.use("/api/v1/idea",         ideaRouter);
app.use("/api/v1/project",      projectRouter);
app.use("/api/v1/project-diary",projectDiaryRouter);
app.use("/api/v1/todo",         todoRouter);
app.use("/api/v1/notes",        noteRouter);
app.use("/api/v1/streak",       streakRouter);
app.use("/api/v1/update",       updateRouter);
app.use("/api/v1/contact",      contactRouter);
app.use("/api/v1/ai",           aiRouter);
app.use("/api/v1/category",     categoryRouter);
app.use("/api/v1/template",     questionTemplateRouter);
app.use("/api/v1/blog",         blogRouter);
app.use("/api/v1/diary",        diaryRouter);

// ── Health ─────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("<h1>Aditya's Portfolio Server</h1>"));
app.get("/health-check", (req, res) => res.status(200).json({ success: true }));

app.use(errorHandler);

export default app;
