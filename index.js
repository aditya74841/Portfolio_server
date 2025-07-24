import express from "express";
import fs from "fs";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Prompt } from "./model/prompt.model.js";
import { errorHandler } from "./middlewares/error.middlewares.js";
import categoryRouter from "./routes/category.routes.js";
import updateRouter from "./routes/update.routes.js";
import aiRouter from "./routes/prompt.routes.js";

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

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for the AI assistant endpoint
const askLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 AI questions per 10 minutes
  message: {
    error: "Too many AI questions from this IP. Please wait before asking more questions.",
    retryAfter: "10 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use ipKeyGenerator for proper IPv6 handling
  keyGenerator: (req) => {
    return ipKeyGenerator(req.ip);
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

// Very strict rate limiting for potential abuse endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 requests per hour for very sensitive endpoints
  message: {
    error: "Rate limit exceeded. This endpoint has strict limits.",
    retryAfter: "1 hour"
  }
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Enhanced keyword-link mapping with better context detection
const keywordLinks = {
  portfolio: "https://iamadityaranjan.com",
  github: "https://github.com/aditya74841",
  auditproject: "https://audit.iamadityaranjan.com",
  leetcode: "https://leetcode.com/aditya7884/",
  onlinecv: "https://iamadityaranjan.com/cv",
  linkedin: "https://www.linkedin.com/in/iamadityaranjan",
  email: "mailto:adityaranjan.dev@gmail.com",
  contact: "https://iamadityaranjan.com/#contact",
  projects: "https://iamadityaranjan.com/#projects",
  resume: "https://iamadityaranjan.com/cv"
};

// IP helper
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
};

// Apply specific rate limiting to route groups
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/update", updateRouter);
app.use("/api/v1/ai", aiRouter);

// Enhanced link detection function
const enhanceResponseWithLinks = (answer, question) => {
  const lower = question.toLowerCase();
  let enhancedAnswer = answer;
  
  // Contact-related enhancements
  if (lower.includes('contact') || lower.includes('reach') || lower.includes('connect')) {
    if (!enhancedAnswer.includes('iamadityaranjan.com')) {
      enhancedAnswer += `\n\nYou can connect with me through:\n- [Portfolio Website](https://iamadityaranjan.com)\n- [LinkedIn](https://www.linkedin.com/in/iamadityaranjan)\n- [GitHub](https://github.com/aditya74841)`;
    }
  }
  
  // Project-related enhancements
  if (lower.includes('project') && !enhancedAnswer.includes('github.com')) {
    enhancedAnswer += `\n\nCheck out my projects on [GitHub](https://github.com/aditya74841) or visit my [Portfolio](https://iamadityaranjan.com/projects) for detailed case studies.`;
  }
  
  // Skills-related enhancements
  if (lower.includes('skill') || lower.includes('technology') || lower.includes('stack')) {
    if (!enhancedAnswer.includes('leetcode.com')) {
      enhancedAnswer += `\n\nYou can see my problem-solving skills on [LeetCode](https://leetcode.com/aditya7884/) and explore my technical projects on [GitHub](https://github.com/aditya74841).`;
    }
  }
  
  // Resume/CV related
  if (lower.includes('resume') || lower.includes('cv') || lower.includes('experience')) {
    if (!enhancedAnswer.includes('/cv')) {
      enhancedAnswer += `\n\nYou can view my detailed resume at [Online CV](https://iamadityaranjan.com/cv).`;
    }
  }
  
  return enhancedAnswer;
};

// POST /ask - Apply specific rate limiting for AI assistant
app.post("/ask", askLimiter, async (req, res) => {
  const question = req.body.question;
  const ip = getClientIp(req);
  const shouldSave = req.query.save !== "false";

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const context = fs.readFileSync("about_me.txt", "utf-8");

  const prompt = `
You are Aditya Ranjan's AI assistant. Based on the context below, answer questions about Aditya in first person as if you are him.

Context about Aditya:
${context}

Important Guidelines:
1. Always respond in first person ("I am", "My experience", etc.)
2. Be conversational and professional
3. For contact information, provide actual links using markdown format: [Link Text](URL)
4. When mentioning projects or skills, include relevant links when appropriate
5. Keep responses concise but informative
6. If asked about contact details, always provide the portfolio website link

Available Links (use when relevant):
- Portfolio: https://iamadityaranjan.com
- GitHub: https://github.com/aditya74841
- LinkedIn: https://www.linkedin.com/in/iamadityaranjan
- LeetCode: https://leetcode.com/aditya7884/
- Online CV: https://iamadityaranjan.com/cv
- Projects Demo: https://audit.iamadityaranjan.com
Question: ${question}
`;

  try {
    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    let answer =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I apologize, but I couldn't generate a response at the moment. Please try asking again.";

    // Enhance the response with relevant links
    answer = enhanceResponseWithLinks(answer, question);

    // Save if required
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
    res.status(500).json({ 
      error: "I'm having trouble processing your request right now. Please try again in a moment." 
    });
  }
});

// Health check - No additional rate limiting needed
app.get("/health-check", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.get("/", (req, res) => {
  res.send("<h1>Aditya's AI Assistant Server</h1><p>Server is running perfectly</p>");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.use(errorHandler);



// import express from "express";
// import fs from "fs";
// import axios from "axios";
// import cors from "cors";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { Prompt } from "./model/prompt.model.js";
// import { errorHandler } from "./middlewares/error.middlewares.js";
// import categoryRouter from "./routes/category.routes.js";
// import updateRouter from "./routes/update.routes.js";

// dotenv.config();

// const app = express();
// app.use(express.json());
// app.use(cors({ origin: "*" }));

// const PORT = process.env.PORT || 8080;
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const MONGODB_URI = process.env.MONGODB_URI;

// const GEMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// // Connect to MongoDB
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("✅ Connected to MongoDB"))
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });

// // Enhanced keyword-link mapping with better context detection
// const keywordLinks = {
//   portfolio: "https://iamadityaranjan.com",
//   github: "https://github.com/aditya74841",
//   auditproject: "https://audit.iamadityaranjan.com",
//   leetcode: "https://leetcode.com/aditya7884/",
//   onlinecv: "https://iamadityaranjan.com/cv",
//   linkedin: "https://www.linkedin.com/in/iamadityaranjan",
//   email: "mailto:adityaranjan.dev@gmail.com",
//   contact: "https://iamadityaranjan.com/#contact",
//   projects: "https://iamadityaranjan.com/#projects",
//   resume: "https://iamadityaranjan.com/cv"
// };

// // IP helper
// const getClientIp = (req) => {
//   const forwarded = req.headers["x-forwarded-for"];
//   return forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
// };

// app.use("/api/v1/category", categoryRouter);
// app.use("/api/v1/update", updateRouter);

// // Enhanced link detection function
// const enhanceResponseWithLinks = (answer, question) => {
//   const lower = question.toLowerCase();
//   let enhancedAnswer = answer;
  
//   // Contact-related enhancements
//   if (lower.includes('contact') || lower.includes('reach') || lower.includes('connect')) {
//     if (!enhancedAnswer.includes('iamadityaranjan.com')) {
//       enhancedAnswer += `\n\nYou can connect with me through:\n- [Portfolio Website](https://iamadityaranjan.com)\n- [LinkedIn](https://www.linkedin.com/in/iamadityaranjan)\n- [GitHub](https://github.com/aditya74841)`;
//     }
//   }
  
//   // Project-related enhancements
//   if (lower.includes('project') && !enhancedAnswer.includes('github.com')) {
//     enhancedAnswer += `\n\nCheck out my projects on [GitHub](https://github.com/aditya74841) or visit my [Portfolio](https://iamadityaranjan.com/projects) for detailed case studies.`;
//   }
  
//   // Skills-related enhancements
//   if (lower.includes('skill') || lower.includes('technology') || lower.includes('stack')) {
//     if (!enhancedAnswer.includes('leetcode.com')) {
//       enhancedAnswer += `\n\nYou can see my problem-solving skills on [LeetCode](https://leetcode.com/aditya7884/) and explore my technical projects on [GitHub](https://github.com/aditya74841).`;
//     }
//   }
  
//   // Resume/CV related
//   if (lower.includes('resume') || lower.includes('cv') || lower.includes('experience')) {
//     if (!enhancedAnswer.includes('/cv')) {
//       enhancedAnswer += `\n\nYou can view my detailed resume at [Online CV](https://iamadityaranjan.com/cv).`;
//     }
//   }
  
//   return enhancedAnswer;
// };

// // POST /ask
// app.post("/ask", async (req, res) => {
//   const question = req.body.question;
//   const ip = getClientIp(req);
//   const shouldSave = req.query.save !== "false";

//   if (!question) {
//     return res.status(400).json({ error: "Question is required" });
//   }

//   const context = fs.readFileSync("about_me.txt", "utf-8");

//   const prompt = `
// You are Aditya Ranjan's AI assistant. Based on the context below, answer questions about Aditya in first person as if you are him.

// Context about Aditya:
// ${context}

// Important Guidelines:
// 1. Always respond in first person ("I am", "My experience", etc.)
// 2. Be conversational and professional
// 3. For contact information, provide actual links using markdown format: [Link Text](URL)
// 4. When mentioning projects or skills, include relevant links when appropriate
// 5. Keep responses concise but informative
// 6. If asked about contact details, always provide the portfolio website link

// Available Links (use when relevant):
// - Portfolio: https://iamadityaranjan.com
// - GitHub: https://github.com/aditya74841
// - LinkedIn: https://www.linkedin.com/in/iamadityaranjan
// - LeetCode: https://leetcode.com/aditya7884/
// - Online CV: https://iamadityaranjan.com/cv
// - Projects Demo: https://audit.iamadityaranjan.com
// Question: ${question}
// `;

//   try {
//     const geminiRes = await axios.post(
//       `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }],
//       }
//     );

//     let answer =
//       geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "I apologize, but I couldn't generate a response at the moment. Please try asking again.";

//     // Enhance the response with relevant links
//     answer = enhanceResponseWithLinks(answer, question);

//     // Save if required
//     if (shouldSave) {
//       const newPrompt = new Prompt({
//         title: question,
//         response: answer,
//         ipAddress: ip,
//       });
//       await newPrompt.save();
//     }

//     res.status(200).json({ answer, saved: shouldSave });
//   } catch (error) {
//     console.error("❌ Error in /ask:", error.message);
//     res.status(500).json({ 
//       error: "I'm having trouble processing your request right now. Please try again in a moment." 
//     });
//   }
// });

// // Health check
// app.get("/health-check", (req, res) => {
//   res.status(200).json({ message: "Server is healthy" });
// });

// app.get("/", (req, res) => {
//   res.send("<h1>Aditya's AI Assistant Server</h1><p>Server is running perfectly</p>");
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });

// app.use(errorHandler);

