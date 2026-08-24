/**
 * idea-questioner.service.js
 *
 * Phase 1 — AI Idea Validation
 *
 * Triggered automatically (fire-and-forget) after a user saves an idea.
 * Takes only the idea title + description and generates 5 clarifying questions.
 *
 * NO web search at this stage. The user's idea may not be clear enough yet
 * to search effectively. Questions are purely to understand the user's intent.
 * (Tavily search is reserved for Phase 2 — the report generation.)
 *
 * LLM Strategy:
 *   PRIMARY  → OpenRouter: nvidia/nemotron-3-ultra-550b-a55b:free (with reasoning)
 *   FALLBACK → Groq:       llama-3.1-8b-instant
 */

import Groq from "groq-sdk";
import { Idea } from "../idea.model.js";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const GROQ_MODEL = "llama-3.1-8b-instant";

const groq = new Groq({ apiKey: GROQ_API_KEY });

// ─────────────────────────────────────────────
// 📋 System Prompt
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior product advisor helping a developer think through their idea before building.

Given an idea title and description, generate exactly 5 short, clear clarifying questions.
The goal is to understand the developer's intent before any research or validation begins.

One question per category — in this order:
1. "problem"          — What specific problem are you solving and who currently has this problem?
2. "target_audience"  — Who exactly is your primary user? Be as specific as possible.
3. "competition"      — Are you aware of existing tools that do something similar? How is yours different?
4. "technical"        — Do you plan to build this yourself? What is your current technical skill level?
5. "business"         — Is this a revenue-generating product, a portfolio project, or a personal tool?

Rules:
- Keep each question under 20 words. Conversational, not corporate.
- Tailor every question to the specific idea given — not generic.
- Return ONLY a valid JSON object. No markdown. No explanation. No extra text.

Output format:
{
  "questions": [
    { "category": "problem",         "question": "..." },
    { "category": "target_audience", "question": "..." },
    { "category": "competition",     "question": "..." },
    { "category": "technical",       "question": "..." },
    { "category": "business",        "question": "..." }
  ]
}`;

// ─────────────────────────────────────────────
// 🛸 PRIMARY: OpenRouter — Nemotron Ultra :free
// ─────────────────────────────────────────────
async function callOpenRouter(title, description) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://portfolio-dashboard.local",
      "X-Title": "Idea Validator",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Title: ${title}\n\nDescription: ${description}`,
        },
      ],
      reasoning: { enabled: true },
      temperature: 0.4,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) throw new Error("OpenRouter returned empty content");
  return content;
}

// ─────────────────────────────────────────────
// 🔁 FALLBACK: Groq — llama-3.1-8b-instant
// ─────────────────────────────────────────────
async function callGroq(title, description) {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Title: ${title}\n\nDescription: ${description}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  const content = response?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return content;
}

// ─────────────────────────────────────────────
// 🧠 Parse LLM output → clean questions array
// ─────────────────────────────────────────────
function parseQuestions(raw) {
  const jsonStr = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Model returned empty questions array");
  }

  return parsed.questions.map((q) => ({
    question: q.question,
    category: q.category,
    answer: null,
    answeredAt: null,
  }));
}

// ─────────────────────────────────────────────
// 🤖 Main export
// ─────────────────────────────────────────────
export async function runQuestionAgent(ideaId, title, description) {
  console.log(`[Questioner] 🚀 "${title}" (${ideaId})`);

  await Idea.findByIdAndUpdate(
    ideaId,
    { aiStatus: "generating_questions" },
    { new: true },
  );

  try {
    // Try OpenRouter first — fallback to Groq automatically
    let rawContent;
    let provider = "OpenRouter";

    try {
      console.log("[Questioner] 🛸 Trying OpenRouter (Nemotron Ultra)...");
      rawContent = await callOpenRouter(title, description);
    } catch (err) {
      console.warn(`[Questioner] ⚠️ OpenRouter failed: ${err.message}`);
      console.log("[Questioner] 🔁 Falling back to Groq...");
      provider = "Groq";
      rawContent = await callGroq(title, description);
    }

    const questions = parseQuestions(rawContent);

    await Idea.findByIdAndUpdate(
      ideaId,
      {
        aiStatus: "questions_ready",
        questions,
      },
      { new: true },
    );

    console.log(
      `[Questioner] ✅ ${questions.length} questions saved (via ${provider})`,
    );
  } catch (err) {
    console.error(`[Questioner] ❌ Both providers failed:`, err.message);
    await Idea.findByIdAndUpdate(ideaId, {
      aiStatus: "failed_questions",
    }).catch(() => {});
  }
}
