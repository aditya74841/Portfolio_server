
// ===== BACKEND: controllers/chatController.js =====
import { Groq } from "groq-sdk";
import { Ai } from "../model/ai.model.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are an AI assistant that helps the user (Aditya Ranjan).
Use the user's background only as context. Do NOT impersonate the user.
Respond professionally, clearly, and with high technical accuracy.
`;

const ABOUT_ME = `
User Profile:
Name: Aditya Ranjan, Full Stack Developer with 2.5+ years experience.
Expertise: JavaScript, TypeScript, React, Next.js, Node.js, Express.js, MongoDB, Redux, TailwindCSS, Socket.io.
Built systems for 10,000+ users and POS systems processing 500+ daily transactions.
Optimized platforms for 30% faster load and 20% higher engagement.
AI-assisted workflow improving productivity by 40%.
Currently seeking Full Stack Developer role (7+ LPA).
`;

export const chatController = async (req, res) => {
  try {
    const { message } = req.body;
    const { id } = req.query;

    let existingAI = {};

    if (!id) {
      // Create new chat
      const combinedMessage = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: ABOUT_ME,
        },
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

      existingAI.messages.push({ role: "user", content: message.trim() });
    }

    // Set headers for streaming text
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // Get streaming response from Groq
    const stream = await groq.chat.completions.create({
      messages: existingAI.messages,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null,
    });

    let fullResponse = "";

    // Stream the response to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      res.write(content);
    }

    // Send metadata separator
    res.write("\n__METADATA__\n");
    
    // Save the full response to database
    existingAI.messages.push({
      role: "assistant",
      content: fullResponse,
    });

    await existingAI.save();

    // Send the ID as JSON metadata
    res.write(JSON.stringify({ aiId: existingAI._id.toString() }));
    res.end();
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




// import { Groq } from "groq-sdk";
// import { Ai } from "../model/ai.model.js";

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
//     } else {
//       // Continue existing chat
//       existingAI = await Ai.findById(id);

//       if (!existingAI) {
//         return res.status(404).json({ error: "AI record not found." });
//       }

//       existingAI.messages.push({ role: "user", content: message.trim() });
//     }

//     // Set headers for streaming
//     res.setHeader("Content-Type", "application/json");
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

//     // Save the full response to database
//     existingAI.messages.push({
//       role: "assistant",
//       content: fullResponse,
//     });

//     await existingAI.save();

//     // Send the ID at the end
//     res.write(JSON.stringify({ aiId: existingAI._id }));
//     res.end();
//   } catch (error) {
//     console.error("ChatController Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // GET endpoint to fetch existing messages
// export const getMessagesController = async (req, res) => {
//   try {
//     console.log("Get Messages Controller Invoked");
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

