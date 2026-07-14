/**
 * API Integration Tests: Updates (Daily Journal)
 * Tests for creating daily journal entries, QA operations, mood, screen time, and more.
 */

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { connectTestDB, clearDatabase, createTestUser, getAuthToken, authHeader } from "../helpers.js";

describe("Updates API", () => {
  beforeAll(async () => { await connectTestDB(); });
  afterEach(async () => { await clearDatabase(); });

  async function setupUser(overrides = {}) {
    const user = await createTestUser(overrides);
    return { user, token: getAuthToken(user) };
  }

  async function createUpdate(token, data = {}) {
    return request(app).post("/api/v1/update").set(authHeader(token))
      .send({ date: "2026-07-14", title: "Daily Journal", ...data });
  }

  describe("Authentication", () => {
    it("should return 401 without a token", async () => {
      expect((await request(app).get("/api/v1/update")).status).toBe(401);
    });
  });

  // ─── POST /api/v1/update ────────────────────────────────────────────

  describe("POST /api/v1/update", () => {
    it("should create a daily update", async () => {
      const { token } = await setupUser();
      const res = await createUpdate(token);
      expect(res.status).toBe(201);
      expect(res.body.data.date).toBe("2026-07-14");
      expect(res.body.data.title).toBe("Daily Journal");
    });

    it("should reject without a date", async () => {
      const { token } = await setupUser();
      const res = await request(app).post("/api/v1/update").set(authHeader(token))
        .send({ title: "No Date" });
      expect(res.status).toBe(400);
    });

    it("should reject duplicate date for same user", async () => {
      const { token } = await setupUser();
      await createUpdate(token, { date: "2026-07-14" });
      const res = await createUpdate(token, { date: "2026-07-14" });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already exists");
    });

    it("should allow same date for different users", async () => {
      const a = await setupUser({ email: "a@update.com" });
      const b = await setupUser({ email: "b@update.com" });
      expect((await createUpdate(a.token, { date: "2026-07-14" })).status).toBe(201);
      expect((await createUpdate(b.token, { date: "2026-07-14" })).status).toBe(201);
    });
  });

  // ─── GET /api/v1/update ─────────────────────────────────────────────

  describe("GET /api/v1/update", () => {
    it("should return all updates for the user", async () => {
      const { token } = await setupUser();
      await createUpdate(token, { date: "2026-07-13" });
      await createUpdate(token, { date: "2026-07-14" });
      const res = await request(app).get("/api/v1/update").set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  // ─── GET /api/v1/update/:id ─────────────────────────────────────────

  describe("GET /api/v1/update/:id", () => {
    it("should return a single update", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).get(`/api/v1/update/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.date).toBe("2026-07-14");
    });

    it("should return 404 for non-existent update", async () => {
      const { token } = await setupUser();
      const res = await request(app).get("/api/v1/update/507f1f77bcf86cd799439011").set(authHeader(token));
      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /api/v1/update/:id/title ─────────────────────────────────

  describe("PATCH /api/v1/update/:id/title", () => {
    it("should update the title", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/title`).set(authHeader(token))
        .send({ title: "New Title" });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("New Title");
    });

    it("should reject without a title", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/title`).set(authHeader(token)).send({});
      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /api/v1/update/:id/mood ──────────────────────────────────

  describe("PATCH /api/v1/update/:id/mood", () => {
    it("should update mood and why", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/mood`).set(authHeader(token))
        .send({ mood: "great", why: "Productive day!" });
      expect(res.status).toBe(200);
      expect(res.body.data.mood).toBe("great");
      expect(res.body.data.why).toBe("Productive day!");
    });

    it("should reject invalid mood value", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/mood`).set(authHeader(token))
        .send({ mood: "ecstatic" }); // not in enum
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ─── PATCH /api/v1/update/:id/content ───────────────────────────────

  describe("PATCH /api/v1/update/:id/content", () => {
    it("should update the main content text", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/content`).set(authHeader(token))
        .send({ update: "Today I built tests for my portfolio server!" });
      expect(res.status).toBe(200);
      expect(res.body.data.update).toBe("Today I built tests for my portfolio server!");
    });
  });

  // ─── PATCH /api/v1/update/:id/toggle-visibility ─────────────────────

  describe("PATCH /api/v1/update/:id/toggle-visibility", () => {
    it("should toggle isPublic from false to true", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/toggle-visibility`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.isPublic).toBe(true);
    });

    it("should toggle back to false", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      await request(app).patch(`/api/v1/update/${id}/toggle-visibility`).set(authHeader(token));
      const res = await request(app).patch(`/api/v1/update/${id}/toggle-visibility`).set(authHeader(token));
      expect(res.body.data.isPublic).toBe(false);
    });
  });

  // ─── PATCH /api/v1/update/:id/screen-time ───────────────────────────

  describe("PATCH /api/v1/update/:id/screen-time", () => {
    it("should update screen time", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).patch(`/api/v1/update/${id}/screen-time`).set(authHeader(token))
        .send({ hours: 6, minutes: 30, note: "Mostly coding" });
      expect(res.status).toBe(200);
      expect(res.body.data.screenTime.hours).toBe(6);
      expect(res.body.data.screenTime.minutes).toBe(30);
      expect(res.body.data.screenTime.note).toBe("Mostly coding");
    });
  });

  // ─── QA Operations ──────────────────────────────────────────────────

  describe("QA Operations", () => {
    it("should add a question", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      const res = await request(app).post(`/api/v1/update/${id}/qa`).set(authHeader(token))
        .send({ question: "What did I learn?", answer: "Testing!" });
      expect(res.status).toBe(200);
      expect(res.body.data.qas.length).toBeGreaterThanOrEqual(1);
    });

    it("should update an answer", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      // Add a QA first
      await request(app).post(`/api/v1/update/${id}/qa`).set(authHeader(token))
        .send({ question: "Q1", answer: "Old" });
      // Update the answer (index 0)
      const res = await request(app).patch(`/api/v1/update/${id}/qa/answer`).set(authHeader(token))
        .send({ index: 0, answer: "New Answer" });
      expect(res.status).toBe(200);
      expect(res.body.data.qas[0].answer).toBe("New Answer");
    });

    it("should delete a question", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      await request(app).post(`/api/v1/update/${id}/qa`).set(authHeader(token))
        .send({ question: "To Delete", answer: "..." });
      const beforeLen = (await request(app).get(`/api/v1/update/${id}`).set(authHeader(token))).body.data.qas.length;
      await request(app).delete(`/api/v1/update/${id}/qa`).set(authHeader(token)).send({ index: 0 });
      const afterLen = (await request(app).get(`/api/v1/update/${id}`).set(authHeader(token))).body.data.qas.length;
      expect(afterLen).toBe(beforeLen - 1);
    });
  });

  // ─── DELETE /api/v1/update/:id ──────────────────────────────────────

  describe("DELETE /api/v1/update/:id", () => {
    it("should delete an update", async () => {
      const { token } = await setupUser();
      const id = (await createUpdate(token)).body.data._id;
      expect((await request(app).delete(`/api/v1/update/${id}`).set(authHeader(token))).status).toBe(200);
      expect((await request(app).get(`/api/v1/update/${id}`).set(authHeader(token))).status).toBe(404);
    });
  });

  // ─── User Isolation ─────────────────────────────────────────────────

  describe("User Isolation", () => {
    it("User A should NOT see User B's updates", async () => {
      const a = await setupUser({ email: "a@u.com" });
      const b = await setupUser({ email: "b@u.com" });
      await createUpdate(a.token, { date: "2026-07-14" });
      const res = await request(app).get("/api/v1/update").set(authHeader(b.token));
      expect(res.body.data).toHaveLength(0);
    });
  });
});
