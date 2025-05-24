const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config(); // Load .env

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const PORT = 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";


// app.post("/ask", async (req, res) => {
//   const question = req.body.question;
//   try {
//     const context = fs.readFileSync("about_me.txt", "utf-8");

//     const prompt = `
// Answer the question below as if you are Aditya Ranjan, speaking naturally in the first person.

// Context:
// ${context}

// Question:
// ${question}

// Answer:
//     `;

//     const geminiRes = await axios.post(
//       `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [{ text: prompt }],
//           },
//         ],
//       }
//     );

//     const answer =
//       geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "No answer found.";

//     res.json({ answer });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to get answer from Gemini." });
//   }
// });

app.post("/ask", async (req, res) => {
  const question = req.body.question;
  const context = fs.readFileSync("about_me.txt", "utf-8");

  const keywordLinks = {
    "portfolio": "https://iamadityaranjan.com",
    "github": "https://github.com/aditya74841",
    "audit project": "https://audit-demo.netlify.app",
    "leetcode": "https://leetcode.com/aditya7884/",
  };

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

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: "Failed to get answer from Gemini." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
