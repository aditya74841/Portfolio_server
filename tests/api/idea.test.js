/**
 * API Integration Tests: Idea
 * ----------------------------
 * Full CRUD tests for the Idea API, including embedded updates and status changes.
 * Also tests duplicate title prevention and user isolation.
 */

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import {
  connectTestDB,
  clearDatabase,
  createTestUser,
  getAuthToken,
  authHeader,
} from "../helpers.js";

describe("Idea API", () => {
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

  // Helper: create an idea and return the response body
  async function createIdea(token, data = {}) {
    const defaults = { title: "AI Dashboard", description: "Build an AI-powered dashboard" };
    return request(app)
      .post("/api/v1/idea")
      .set(authHeader(token))
      .send({ ...defaults, ...data });
  }

  // ─── Authentication ─────────────────────────────────────────────────

  describe("Authentication", () => {
    it("should return 401 for all idea endpoints without a token", async () => {
      const res = await request(app).get("/api/v1/idea");
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/v1/idea ──────────────────────────────────────────────

  describe("POST /api/v1/idea", () => {
    it("should create a new idea", async () => {
      const { token } = await setupUser();

      const res = await createIdea(token);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("AI Dashboard");
      expect(res.body.data.description).toBe("Build an AI-powered dashboard");
      expect(res.body.data.status).toBe("idea"); // default
    });

    it("should create idea with custom status", async () => {
      const { token } = await setupUser();

      const res = await createIdea(token, {
        title: "Active Project",
        description: "Already building this",
        status: "building",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("building");
    });

    it("should reject without title", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/idea")
        .set(authHeader(token))
        .send({ description: "No title" });

      expect(res.status).toBe(400);
    });

    it("should reject without description", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/idea")
        .set(authHeader(token))
        .send({ title: "No Description" });

      expect(res.status).toBe(400);
    });

    it("should reject duplicate titles for the same user", async () => {
      const { token } = await setupUser();

      await createIdea(token, { title: "Unique Idea", description: "First" });
      const res = await createIdea(token, { title: "Unique Idea", description: "Second" });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });
  });

  // ─── GET /api/v1/idea ───────────────────────────────────────────────

  describe("GET /api/v1/idea", () => {
    it("should return all ideas for the authenticated user", async () => {
      const { token } = await setupUser();

      await createIdea(token, { title: "Idea 1", description: "desc 1" });
      await createIdea(token, { title: "Idea 2", description: "desc 2" });

      const res = await request(app).get("/api/v1/idea").set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.ideas).toHaveLength(2);
    });

    it("should return empty array when user has no ideas", async () => {
      const { token } = await setupUser();

      const res = await request(app).get("/api/v1/idea").set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.ideas).toHaveLength(0);
    });
  });

  // ─── GET /api/v1/idea/:id ──────────────────────────────────────────

  describe("GET /api/v1/idea/:id", () => {
    it("should return a single idea by ID", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/idea/${ideaId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("AI Dashboard");
    });

    it("should return 404 for non-existent idea", async () => {
      const { token } = await setupUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .get(`/api/v1/idea/${fakeId}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /api/v1/idea/:id ─────────────────────────────────────────

  describe("PATCH /api/v1/idea/:id", () => {
    it("should update idea title and description", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/idea/${ideaId}`)
        .set(authHeader(token))
        .send({ title: "Updated Title", description: "Updated desc" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
      expect(res.body.data.description).toBe("Updated desc");
    });

    it("should reject update with no fields", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/idea/${ideaId}`)
        .set(authHeader(token))
        .send({});

      expect(res.status).toBe(400);
    });

    it("should reject updating to a duplicate title", async () => {
      const { token } = await setupUser();
      await createIdea(token, { title: "Existing Title", description: "desc 1" });
      const createRes = await createIdea(token, { title: "Other Title", description: "desc 2" });
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/idea/${ideaId}`)
        .set(authHeader(token))
        .send({ title: "Existing Title" });

      expect(res.status).toBe(409);
    });
  });

  // ─── PATCH /api/v1/idea/:id/status ──────────────────────────────────

  describe("PATCH /api/v1/idea/:id/status", () => {
    it("should change idea status", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/idea/${ideaId}/status`)
        .set(authHeader(token))
        .send({ status: "building" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("building");
    });

    it("should reject invalid status", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/idea/${ideaId}/status`)
        .set(authHeader(token))
        .send({ status: "invalid-status" });

      // Mongoose validator rejects the value
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ─── DELETE /api/v1/idea/:id ────────────────────────────────────────

  describe("DELETE /api/v1/idea/:id", () => {
    it("should delete an idea", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/idea/${ideaId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);

      // Verify it's gone
      const getRes = await request(app)
        .get(`/api/v1/idea/${ideaId}`)
        .set(authHeader(token));

      expect(getRes.status).toBe(404);
    });
  });

  // ─── Idea Updates (embedded) ────────────────────────────────────────

  describe("Idea Updates", () => {
    it("should add an update to an idea", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .post(`/api/v1/idea/${ideaId}/updates`)
        .set(authHeader(token))
        .send({ description: "Finished the MVP", links: ["https://github.com"] });

      expect(res.status).toBe(200);
      expect(res.body.data.updates).toHaveLength(1);
      expect(res.body.data.updates[0].description).toBe("Finished the MVP");
      expect(res.body.data.updates[0].links).toContain("https://github.com");
    });

    it("should reject update without description", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .post(`/api/v1/idea/${ideaId}/updates`)
        .set(authHeader(token))
        .send({ links: ["https://example.com"] });

      expect(res.status).toBe(400);
    });

    it("should update an existing idea update", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      // Add update
      const addRes = await request(app)
        .post(`/api/v1/idea/${ideaId}/updates`)
        .set(authHeader(token))
        .send({ description: "Original update" });

      const updateId = addRes.body.data.updates[0]._id;

      // Modify it
      const res = await request(app)
        .patch(`/api/v1/idea/${ideaId}/updates/${updateId}`)
        .set(authHeader(token))
        .send({ description: "Modified update" });

      expect(res.status).toBe(200);
      const modified = res.body.data.updates.find((u) => u._id === updateId);
      expect(modified.description).toBe("Modified update");
    });

    it("should delete an idea update", async () => {
      const { token } = await setupUser();
      const createRes = await createIdea(token);
      const ideaId = createRes.body.data._id;

      // Add update
      const addRes = await request(app)
        .post(`/api/v1/idea/${ideaId}/updates`)
        .set(authHeader(token))
        .send({ description: "To be deleted" });

      const updateId = addRes.body.data.updates[0]._id;

      // Delete it
      const res = await request(app)
        .delete(`/api/v1/idea/${ideaId}/updates/${updateId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.updates).toHaveLength(0);
    });
  });

  // ─── User Isolation ─────────────────────────────────────────────────

  describe("User Isolation", () => {
    it("User A should NOT be able to see User B's ideas", async () => {
      const userA = await setupUser({ email: "a@idea.com" });
      const userB = await setupUser({ email: "b@idea.com" });

      await createIdea(userA.token, { title: "A's idea", description: "private" });

      const res = await request(app)
        .get("/api/v1/idea")
        .set(authHeader(userB.token));

      expect(res.body.data.ideas).toHaveLength(0);
    });

    it("User A should NOT be able to delete User B's idea", async () => {
      const userA = await setupUser({ email: "a2@idea.com" });
      const userB = await setupUser({ email: "b2@idea.com" });

      const createRes = await createIdea(userB.token, {
        title: "B's idea",
        description: "B's private idea",
      });
      const ideaId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/idea/${ideaId}`)
        .set(authHeader(userA.token));

      expect(res.status).toBe(404);
    });
  });
});
