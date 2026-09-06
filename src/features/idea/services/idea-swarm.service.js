/**
 * idea-swarm.service.js
 *
 * Phase 2 — Multi-Agent Idea Validation Swarm
 *
 * Runs 4 specialized sub-agents concurrently using OpenRouter Free Tier models:
 *   1. Market & Competitor Agent
 *   2. Tech Lead / CTO Agent
 *   3. Devil's Advocate / Risk Agent
 *   4. Growth & Monetization Agent
 *
 * Then runs the Lead Synthesizer Agent to aggregate findings, write executive summary,
 * and calculate the Viability Score (0-100).
 */

import Groq from "groq-sdk";
import { Idea } from "../idea.model.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Primary OpenRouter Free Models
const OPENROUTER_PRIMARY_MODEL = "google/gemini-2.0-flash-exp:free";
const OPENROUTER_REASONING_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const GROQ_MODEL = "llama-3.1-8b-instant";

const groq = new Groq({ apiKey: GROQ_API_KEY });

// Generic helper to call OpenRouter Free model with Groq fallback
async function callLLMAgent(systemPrompt, userPrompt, modelOverride = null) {
  const model = modelOverride || OPENROUTER_PRIMARY_MODEL;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://portfolio-dashboard.local",
        "X-Title": "Idea Validation Swarm",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    }
  } catch (err) {
    console.warn(`[SwarmLLM] ⚠️ OpenRouter (${model}) failed: ${err.message}. Trying Groq fallback...`);
  }

  // Fallback to Groq
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  return response?.choices?.[0]?.message?.content;
}

function parseJson(raw) {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─────────────────────────────────────────────
// Agent 1: Market & Competitor Agent
// ─────────────────────────────────────────────
async function runMarketAgent(ideaContext) {
  const systemPrompt = `You are an expert Market Research Analyst. Analyze the startup idea and answered questions.
Return ONLY valid JSON matching this schema:
{
  "targetAudience": {
    "description": "...",
    "segments": ["..."],
    "painPoints": ["..."]
  },
  "competitors": [
    {
      "name": "...",
      "website": "https://...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "differentiator": "..."
    }
  ],
  "marketOpportunity": {
    "estimatedSize": "...",
    "growthRate": "...",
    "keyTrends": ["..."],
    "insights": ["..."]
  }
}`;

  const raw = await callLLMAgent(systemPrompt, ideaContext);
  return parseJson(raw);
}

// ─────────────────────────────────────────────
// Agent 2: Tech Lead / CTO Agent
// ─────────────────────────────────────────────
async function runTechLeadAgent(ideaContext) {
  const systemPrompt = `You are a Principal Software Architect / CTO. Analyze the technical requirements of the idea.
Return ONLY valid JSON matching this schema:
{
  "technicalComplexity": {
    "level": "Low" | "Medium" | "High" | "Very High",
    "estimatedBuildTime": "...",
    "recommendedStack": ["..."],
    "coreChallenges": ["..."],
    "whatYoullLearn": ["..."]
  }
}`;

  const raw = await callLLMAgent(systemPrompt, ideaContext, OPENROUTER_REASONING_MODEL);
  return parseJson(raw);
}

// ─────────────────────────────────────────────
// Agent 3: Devil's Advocate / Risk Agent
// ─────────────────────────────────────────────
async function runRiskAgent(ideaContext) {
  const systemPrompt = `You are a Risk Analyst and Legal Advisor. Identify critical risks and fatal flaws for this idea.
Return ONLY valid JSON matching this schema:
{
  "risks": [
    {
      "risk": "...",
      "severity": "Low" | "Medium" | "High",
      "mitigation": "..."
    }
  ],
  "legalConsiderations": ["..."]
}`;

  const raw = await callLLMAgent(systemPrompt, ideaContext);
  return parseJson(raw);
}

// ─────────────────────────────────────────────
// Agent 4: Growth & Monetization Agent
// ─────────────────────────────────────────────
async function runMonetizationAgent(ideaContext) {
  const systemPrompt = `You are a Startup Growth Officer & CFO. Formulate revenue models and next steps.
Return ONLY valid JSON matching this schema:
{
  "monetization": [
    {
      "model": "...",
      "description": "...",
      "estimatedRevenue": "..."
    }
  ],
  "nextSteps": ["..."]
}`;

  const raw = await callLLMAgent(systemPrompt, ideaContext);
  return parseJson(raw);
}

// ─────────────────────────────────────────────
// Agent 5: Lead Synthesizer Agent
// ─────────────────────────────────────────────
async function runSynthesizerAgent(ideaContext, subAgentResults) {
  const systemPrompt = `You are the Managing Partner of a Startup Incubator.
Combine sub-agent analysis into an executive summary and compute an objective Viability Score (0 to 100).
Return ONLY valid JSON matching this schema:
{
  "executiveSummary": "...",
  "problemStatement": "...",
  "viabilityScore": 85
}`;

  const combinedPrompt = `${ideaContext}\n\nSUB-AGENT FINDINGS:\n${JSON.stringify(subAgentResults, null, 2)}`;
  const raw = await callLLMAgent(systemPrompt, combinedPrompt, OPENROUTER_REASONING_MODEL);
  return parseJson(raw);
}

// ─────────────────────────────────────────────
// Main Swarm Orchestrator Export
// ─────────────────────────────────────────────
export async function runSwarmReportAgent(ideaId) {
  console.log(`[SwarmAgent] 🚀 Starting Swarm validation for idea (${ideaId})`);

  const idea = await Idea.findById(ideaId);
  if (!idea) throw new Error("Idea not found for Swarm execution");

  await Idea.findByIdAndUpdate(ideaId, { aiStatus: "generating_report" });

  try {
    const formattedQA = (idea.questions || [])
      .map((q) => `Q (${q.category}): ${q.question}\nA: ${q.answer || "No answer provided"}`)
      .join("\n\n");

    const ideaContext = `IDEA TITLE: ${idea.title}\n\nDESCRIPTION: ${idea.description}\n\nUSER ANSWERS:\n${formattedQA}`;

    console.log(`[SwarmAgent] 🐝 Launching 4 sub-agents in parallel via OpenRouter...`);

    // Run 4 Sub-Agents in Parallel
    const [marketData, techData, riskData, monetizationData] = await Promise.all([
      runMarketAgent(ideaContext),
      runTechLeadAgent(ideaContext),
      runRiskAgent(ideaContext),
      runMonetizationAgent(ideaContext),
    ]);

    const subAgentResults = {
      ...marketData,
      ...techData,
      ...riskData,
      ...monetizationData,
    };

    console.log(`[SwarmAgent] 🧠 Running Lead Synthesizer Agent...`);
    const synthesisData = await runSynthesizerAgent(ideaContext, subAgentResults);

    const fullReport = {
      executiveSummary: synthesisData.executiveSummary,
      problemStatement: synthesisData.problemStatement,
      viabilityScore: synthesisData.viabilityScore || 75,
      targetAudience: marketData.targetAudience,
      competitors: marketData.competitors,
      marketOpportunity: marketData.marketOpportunity,
      technicalComplexity: techData.technicalComplexity,
      monetization: monetizationData.monetization,
      risks: riskData.risks,
      legalConsiderations: riskData.legalConsiderations,
      nextSteps: monetizationData.nextSteps,
      generatedAt: new Date(),
      model: OPENROUTER_PRIMARY_MODEL,
    };

    await Idea.findByIdAndUpdate(ideaId, {
      aiStatus: "report_ready",
      report: fullReport,
    });

    console.log(`[SwarmAgent] ✅ Multi-Agent validation complete! Viability Score: ${fullReport.viabilityScore}/100`);
  } catch (err) {
    console.error(`[SwarmAgent] ❌ Swarm execution failed:`, err.message);
    await Idea.findByIdAndUpdate(ideaId, {
      aiStatus: "failed_report",
    }).catch(() => {});
  }
}
