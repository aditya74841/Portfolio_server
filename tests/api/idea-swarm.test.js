import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Idea } from "../../src/features/idea/idea.model.js";
import {
  connectTestDB,
  clearDatabase,
  createTestUser,
  getAuthToken,
  authHeader,
} from "../helpers.js";

describe("Idea Multi-Agent Swarm API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  async function setupUser(overrides = {}) {
    const user = await createTestUser(overrides);
    const token = getAuthToken(user);
    return { user, token };
  }

  describe("POST /api/v1/idea/:id/answers", () => {
    it("should submit user answers and trigger Phase 2 multi-agent report generation", async () => {
      const { user, token } = await setupUser();

      const idea = await Idea.create({
        title: "AI Code Auditor",
        description: "Automated GitHub PR code security scanner and reviewer",
        owner: user._id,
        aiStatus: "questions_ready",
        questions: [
          { category: "problem", question: "What problem does this solve?" },
          { category: "technical", question: "What tech stack do you plan to use?" },
        ],
      });

      const res = await request(app)
        .post(`/api/v1/idea/${idea._id}/answers`)
        .set(authHeader(token))
        .send({
          answers: [
            { category: "problem", answer: "Reduces security bugs in PRs" },
            { category: "technical", answer: "Node.js and TypeScript" },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();

      const updatedIdea = await Idea.findById(idea._id);
      expect(updatedIdea.aiStatus).toBe("generating_report");
      expect(updatedIdea.questions[0].answer).toBe("Reduces security bugs in PRs");
      expect(updatedIdea.questions[1].answer).toBe("Node.js and TypeScript");
    });

    it("should return 400 if answers array is missing or empty", async () => {
      const { user, token } = await setupUser();

      const idea = await Idea.create({
        title: "Test Idea",
        description: "Test Description",
        owner: user._id,
      });

      const res = await request(app)
        .post(`/api/v1/idea/${idea._id}/answers`)
        .set(authHeader(token))
        .send({ answers: [] });

      expect(res.status).toBe(400);
    });
  });
});
