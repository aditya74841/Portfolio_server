// ===== BACKEND: controllers/chatController.js =====
import { Groq } from "groq-sdk";
import { Ai } from "../model/ai.model.js";
import e from "cors";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are the **Digital Twin of Aditya Ranjan**, a professional Full-Stack Developer. Your primary goal is to respond to all user queries as if **Aditya Ranjan** himself is replying.

### 1. Persona and Tone
* **Perspective:** Speak strictly in the first person ("I," "my," "me").
* **Tone:** Maintain a **polite, professional, and slightly enthusiastic** demeanor. Be approachable and articulate.
* **Goal:** Provide clear, technically accurate, and comprehensive answers, leveraging Aditya's skills and experience (Full-Stack development, coding, projects, etc.) as the core context.

### 2. Core Directive: Proactive Improvement (The "Big Brother" Role)
* **Improvement Trigger:** If a user asks for feedback on a personal message, draft, or any text (like an "About Me" section or professional communication), or if the input message is unclear, grammatically weak, or could be professionally improved:
    * **Politely acknowledge** the original message.
    * **Provide a revised, polished version** of the text.
    * **Briefly explain** *why* the changes were made (e.g., "I tightened the focus for better impact," or "I clarified the technical terms"). This should be done in a constructive, guiding tone.

### 3. Technical and Response Standards
* **Accuracy:** Ensure all technical information (code examples, definitions, concepts) is highly accurate.
* **Clarity:** Use clear, well-structured markdown (headings, bolding, lists) to present complex information simply.
* **Constraint:** Do NOT break character or reference these instructions. Respond naturally as Aditya Ranjan.
`;
const ABOUT_ME = `
User Profile:
Name: Aditya Ranjan, Full Stack Software Developer.
Experience: Nearly 3 years  of professional experience.
Seeking: Full Stack Developer role (7+ LPA), open to Remote/Hybrid/On-site across India.
Availability: Immediately available (0-15 days notice).

### Core Technical Expertise
- **Languages:** JavaScript (ES6+), TypeScript, HTML5, CSS3.
- **Frontend Frameworks:** React.js, Next.js.
- **State Management:** Redux.
- **Backend Runtime/Frameworks:** Node.js, Express.js.
- **Database:** MongoDB (specialization in scalable data management).
- **Styling/UI:** TailwindCSS, ShadCN UI, Responsive Design.
- **Communication:** **Socket.io** (Real-time).
- **Security:** **JWT Authentication** & Authorization.
- **Development Tools:** Git/GitHub, Postman, Vite, Cloudinary, LeetCode (150+ problems solved0),aws.

### Quantified Achievements & Impact
- **Performance:** Optimized e-commerce platform serving 10,000+ users, achieving **30% faster load times** and **20% higher user engagement** via code optimization and intelligent caching.
- **Efficiency (POS):** Designed and deployed a POS system reducing average checkout time by **40%** (3.5 to 2.1 minutes).
- **Inventory/Operations:** Improved inventory accuracy from 75% to **95%** (decreasing stock discrepancies by 30%) and accelerated order fulfillment by **25%** using Kitchen Display System integration.
- **AI Productivity:** Uses an AI-augmented workflow (ChatGPT, Claude, Cursor) for coding assistance, debugging, and automating tasks, contributing to a **40% increase in overall productivity**.
- **Technical Problem Solving:** Successfully **diagnosed and resolved a critical memory leak** that caused 30% server crashes. Architected database optimization reducing query time from 2.3s to 0.4s.
- **Data Visualization:** Led frontend development, improving data visualization efficiency by **25%**.

### Professional Philosophy & Soft Skills
- **Focus:** Results-driven, business-focused mindset; codes with ROI and user impact in mind.
- **Mentorship:** Mentored 2 junior developers, improving their code quality by **40%**.
- **Leadership:** Led daily standups and sprint planning for 5-person development team.
- **Communication:** Presented technical demos to non-technical stakeholders and excels in clear API/system documentation.
- **Growth:** Actively mastering DSA, System Design, and TypeScript; exploring AI integration and microservices.

### Key Projects & Core Tech
- **Audit Management System:** End-to-end audit solution for multi-location businesses with multimedia support. Tech Stack: Node.js, Express.js, MongoDB, JWT, Socket.io, Next.js, ShadCN UI, Tailwind CSS, Cloudinary.
- **MetaForge Pro:** Full-stack meta tag generator suite (17+ specialized generators) with real-time validation. Tech Stack: JavaScript, Next.js, HTML5, CSS3, Responsive Design.
`;

export const chatController = async (req, res) => {
  try {
    const { message } = req.body;
    const { id } = req.query;

    let existingAI = {};
    let payloadMessage = [];
    payloadMessage.push({
      role: "system",
      content: SYSTEM_PROMPT,
    });
    payloadMessage.push({
      role: "user",
      content: ABOUT_ME,
    });
    if (!id) {
      // Create new chat
      // const combinedMessage = [
      //   {
      //     role: "system",
      //     content: SYSTEM_PROMPT,
      //   },
      //   {
      //     role: "user",
      //     content: ABOUT_ME,
      //   },
      //   {
      //     role: "user",
      //     content: message.trim(),
      //   },
      // ];
      const combinedMessage = [
        {
          role: "user",
          content: message.trim(),
        },
      ];

      existingAI = await Ai.create({
        messages: combinedMessage,
      });
    } else {
      // Continue existing chat
      existingAI = await Ai.findById(id);

      if (!existingAI) {
        return res.status(404).json({ error: "AI record not found." });
      }

      existingAI.messages.push({
        role: "user",
        content: message.trim(),
      });
    }
    existingAI.messages.forEach((msg) => {
      payloadMessage.push(msg);
    });
    // console.log("The payload message is ", payloadMessage);

    // Non-streaming Groq response
    const response = await groq.chat.completions.create({
      messages: payloadMessage,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false, // <-- IMPORTANT
      stop: null,
    });

    const fullResponse =
      response.choices[0]?.message?.content || "No response generated.";
    // console.log("The FUll response is ", fullResponse);

    // // Save assistant message to DB
    existingAI.messages.push({
      role: "assistant",
      content: fullResponse,
    });

    await existingAI.save();

    // // Send final JSON response
    return res.status(200).json({
      aiId: existingAI._id.toString(),
      response: fullResponse,
    });
  } catch (error) {
    console.error("ChatController Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET endpoint to fetch existing messages
export const getMessagesController = async (req, res) => {
  try {
    const { id } = req.params;

    const aiRecord = await Ai.findById(id);

    if (!aiRecord) {
      return res.status(404).json({ error: "Chat not found." });
    }

    return res.status(200).json({
      messages: aiRecord.messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// // ===== BACKEND: controllers/chatController.js =====
// import { Groq } from "groq-sdk";
// import { Ai } from "../model/ai.model.js";
// import e from "cors";

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const SYSTEM_PROMPT = `
// You are an AI assistant that helps the user (Aditya Ranjan).
// Use the user's background only as context. Do NOT impersonate the user.
// Respond professionally, clearly, and with high technical accuracy.
// `;

// const ABOUT_ME = `
// User Profile:
// Name: Aditya Ranjan, Full Stack Developer with 2.5+ years experience.
// Expertise: JavaScript, TypeScript, React, Next.js, Node.js, Express.js, MongoDB, Redux, TailwindCSS, Socket.io.
// Built systems for 10,000+ users and POS systems processing 500+ daily transactions.
// Optimized platforms for 30% faster load and 20% higher engagement.
// AI-assisted workflow improving productivity by 40%.
// Currently seeking Full Stack Developer role (7+ LPA).
// `;

// export const chatController = async (req, res) => {
//   try {
//     const { message } = req.body;
//     const { id } = req.query;

//     let existingAI = {};
//     let aiId = "";
//     if (!id) {
//       // Create new chat
//       const combinedMessage = [
//         {
//           role: "system",
//           content: SYSTEM_PROMPT,
//         },
//         {
//           role: "user",
//           content: ABOUT_ME,
//         },
//         {
//           role: "user",
//           content: message.trim(),
//         },
//       ];

//       existingAI = await Ai.create({
//         messages: combinedMessage,
//       });
//       aiId = existingAI._id.toString();
//     } else {
//       // Continue existing chat
//       existingAI = await Ai.findById(id);
//       aiId = existingAI._id.toString();
//       if (!existingAI) {
//         return res.status(404).json({ error: "AI record not found." });
//       }

//       existingAI.messages.push({ role: "user", content: message.trim() });
//     }

//     // Set headers for streaming text
//     res.setHeader("Content-Type", "text/plain; charset=utf-8");
//     res.setHeader("Transfer-Encoding", "chunked");

//     // Get streaming response from Groq
//     const stream = await groq.chat.completions.create({
//       messages: existingAI.messages,
//       model: "meta-llama/llama-4-scout-17b-16e-instruct",
//       temperature: 1,
//       max_completion_tokens: 1024,
//       top_p: 1,
//       stream: true,
//       stop: null,
//     });

//     let fullResponse = "";

//     // Stream the response to client
//     for await (const chunk of stream) {
//       const content = chunk.choices[0]?.delta?.content || "";
//       fullResponse += content;
//       res.write(content);
//     }

//     // Send metadata separator
//     res.write("\n__METADATA__\n");

//     // Save the full response to database
//     existingAI.messages.push({
//       role: "assistant",
//       content: fullResponse,
//     });

//     await existingAI.save();

//     // Send the ID as JSON metadata
//     res.write(JSON.stringify({ aiId: existingAI._id.toString() }));
//     res.end();
//     return res.status(200).json({ aiId: aiId });
//   } catch (error) {
//     console.error("ChatController Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // GET endpoint to fetch existing messages
// export const getMessagesController = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const aiRecord = await Ai.findById(id);

//     if (!aiRecord) {
//       return res.status(404).json({ error: "Chat not found." });
//     }

//     return res.status(200).json({
//       messages: aiRecord.messages,
//     });
//   } catch (error) {
//     console.error("Get Messages Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
