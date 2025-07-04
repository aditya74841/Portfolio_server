import express from "express";
import fs from "fs";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Prompt } from "./model/prompt.model.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const keywordLinks = {
  portfolio: "https://iamadityaranjan.com",
  github: "https://github.com/aditya74841",
  auditproject: "https://audit-demo.netlify.app",
  leetcode: "https://leetcode.com/aditya7884/",
};

// IP helper
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
};

// POST /ask
app.post("/ask", async (req, res) => {
  const question = req.body.question;
  const ip = getClientIp(req);
  const shouldSave = req.query.save !== "false"; // default: true

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const context = fs.readFileSync("about_me.txt", "utf-8");

  const findLink = (question) => {
    const lower = question.toLowerCase();
    for (const keyword in keywordLinks) {
      if (lower.includes(keyword)) {
        return `\nYou can explore it here: ${keywordLinks[keyword]}`;
      }
    }
    return "";
  };

  const extraLink = findLink(question);

  const prompt = `
Below is some context about me:
${context}

Please answer the following question in first person. If relevant, include any important links directly (like portfolio, GitHub, or project demos). Keep it concise and human-like.

Question: ${question}${extraLink}
`;

  try {
    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const answer =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer found.";

    // ✅ Only save if shouldSave is true
    if (shouldSave) {
      const newPrompt = new Prompt({
        title: question,
        response: answer,
        ipAddress: ip,
      });
      await newPrompt.save();
    }

    res.status(200).json({ answer, saved: shouldSave });
  } catch (error) {
    console.error("❌ Error in /ask:", error.message);
    res.status(500).json({ error: "Failed to get answer from Gemini." });
  }
});

// Health check
app.get("/health-check", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.get("/", (req, res) => {
  res.send("<h1>Server is Running Perfectly</h1>");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// // server.js (entry point)
// import express from "express";
// import fs from "fs";
// import axios from "axios";
// import cors from "cors";
// import dotenv from "dotenv";

// dotenv.config(); // Load environment variables

// const app = express();
// app.use(express.json());
// app.use(cors({ origin: "*" }));

// const PORT = process.env.PORT || 8080;

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const GEMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// app.post("/ask", async (req, res) => {
//   const question = req.body.question;
//   console.log("The Question Name is:", question);

//   const context = fs.readFileSync("about_me.txt", "utf-8");

//   const keywordLinks = {
//     portfolio: "https://iamadityaranjan.com",
//     github: "https://github.com/aditya74841",
//     auditproject: "https://audit-demo.netlify.app",
//     leetcode: "https://leetcode.com/aditya7884/",
//   };

//   const findLink = (question) => {
//     const lower = question.toLowerCase();
//     for (const keyword in keywordLinks) {
//       if (lower.includes(keyword)) {
//         return `\nYou can explore it here: ${keywordLinks[keyword]}`;
//       }
//     }
//     return "";
//   };

//   const extraLink = findLink(question);

//   const prompt = `
// Below is some context about me:
// ${context}

// Please answer the following question in first person. If relevant, include any important links directly (like portfolio, GitHub, or project demos). Keep it concise and human-like.

// Question: ${question}${extraLink}
// `;

//   try {
//     const geminiRes = await axios.post(
//       `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }],
//       }
//     );

//     const answer =
//       geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "No answer found.";

//     res.json({ answer });
//   } catch (error) {
//     console.error("Error from Gemini:", error.message);
//     res.status(500).json({ error: "Failed to get answer from Gemini." });
//   }
// });

// app.get("/health-check", (req, res) => {
//   res.status(200).json({ message: "Server is healthy" });
// });

// app.get("/", (req, res) => {
//   res.send("<h1>Server is Running Perfectly</h1>");
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
