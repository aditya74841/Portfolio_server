import mongoose, { Schema } from "mongoose";

// ─────────────────────────────────────────────
// Sub-schema: a single AI-generated question
// ─────────────────────────────────────────────
const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    // Which lens this question probes
    category: {
      type: String,
      enum: ["problem", "target_audience", "competition", "technical", "business"],
      required: true,
    },
    answer: {
      type: String,
      default: null,
      trim: true,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: one competitor entry inside report
// ─────────────────────────────────────────────
const competitorSchema = new Schema(
  {
    name: String,
    website: String,
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    differentiator: String,
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Sub-schema: one risk entry inside report
// ─────────────────────────────────────────────
const riskSchema = new Schema(
  {
    risk: String,
    severity: { type: String, enum: ["Low", "Medium", "High"] },
    mitigation: String,
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Sub-schema: monetization model inside report
// ─────────────────────────────────────────────
const monetizationSchema = new Schema(
  {
    model: String,
    description: String,
    estimatedRevenue: String,
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Sub-schema: full AI-generated report
// ─────────────────────────────────────────────
const reportSchema = new Schema(
  {
    executiveSummary: String,
    problemStatement: String,

    targetAudience: {
      description: String,
      segments: { type: [String], default: [] },
      painPoints: { type: [String], default: [] },
    },

    competitors: { type: [competitorSchema], default: [] },

    marketOpportunity: {
      estimatedSize: String,
      growthRate: String,
      keyTrends: { type: [String], default: [] },
      insights: { type: [String], default: [] },
    },

    technicalComplexity: {
      level: {
        type: String,
        enum: ["Low", "Medium", "High", "Very High"],
      },
      estimatedBuildTime: String,
      recommendedStack: { type: [String], default: [] },
      coreChallenges: { type: [String], default: [] },
      whatYoullLearn: { type: [String], default: [] },
    },

    monetization: { type: [monetizationSchema], default: [] },

    risks: { type: [riskSchema], default: [] },

    legalConsiderations: { type: [String], default: [] },

    nextSteps: { type: [String], default: [] },

    viabilityScore: { type: Number, min: 0, max: 100 },

    generatedAt: { type: Date },
    model: { type: String },
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Sub-schema: project updates (unchanged)
// ─────────────────────────────────────────────
const ideaUpdateSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, "Update description is required"],
      trim: true,
    },
    links: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ─────────────────────────────────────────────
// Main Idea schema
// ─────────────────────────────────────────────
const ideaSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Idea title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Idea description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["idea", "researching", "building", "shipped", "paused"],
      default: "idea",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Idea owner is required"],
      index: true,
    },
    updates: {
      type: [ideaUpdateSchema],
      default: [],
    },

    // ── AI Validation Fields ──────────────────
    // Drives what the frontend shows at every stage
    aiStatus: {
      type: String,
      enum: [
        "idle",               // Just saved, agent not started yet
        "generating_questions", // Agent is running Phase 1
        "questions_ready",    // Questions saved, waiting for user answers
        "generating_report",  // Agent is running Phase 2
        "report_ready",       // Full report available
        "failed_questions",   // Phase 1 failed
        "failed_report",      // Phase 2 failed
      ],
      default: "idle",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    report: {
      type: reportSchema,
      default: null,
    },
  },
  { timestamps: true }
);

ideaSchema.index({ owner: 1, title: 1 }, { unique: true });

export const Idea = mongoose.model("Idea", ideaSchema);
