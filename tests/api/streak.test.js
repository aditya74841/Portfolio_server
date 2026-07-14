/**
 * API Integration Tests: Streak
 * Tests for creating streaks, marking daily progress, stats, and isolation.
 */

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { connectTestDB, clearDatabase, createTestUser, getAuthToken, authHeader } from "../helpers.js";

describe("Streak API", () => {
  beforeAll(async () => { await connectTestDB(); });
  afterEach(async () => { await clearDatabase(); });

  async function setupUser(overrides = {}) {
    const user = await createTestUser(overrides);
    return { user, token: getAuthToken(user) };
  }

  async function createStreak(token, data = {}) {
    return request(app).post("/api/v1/streak").set(authHeader(token))
      .send({ name: "100 Days of Code", description: "Daily coding", ...data });
  }

  describe("Authentication", () => {
    it("should return 401 without a token", async () => {
      expect((await request(app).get("/api/v1/streak")).status).toBe(401);
    });
  });

  describe("POST /api/v1/streak", () => {
    it("should create a streak with default 100 target days", async () => {
      const { token } = await setupUser();
      const res = await createStreak(token);
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("100 Days of Code");
      expect(res.body.data.currentStreak).toBe(0);
      expect(res.body.data.streakNumber).toHaveLength(100);
      expect(res.body.data.isActive).toBe(true);
    });

    it("should create a streak with custom target days", async () => {
      const { token } = await setupUser();
      const res = await createStreak(token, { name: "30 Day", targetDays: 30 });
      expect(res.status).toBe(201);
      expect(res.body.data.streakNumber).toHaveLength(30);
    });

    it("should reject without a name", async () => {
      const { token } = await setupUser();
      const res = await request(app).post("/api/v1/streak").set(authHeader(token)).send({});
      expect(res.status).toBe(400);
    });

    it("should reject duplicate names for same user", async () => {
      const { token } = await setupUser();
      await createStreak(token, { name: "Daily" });
      const res = await createStreak(token, { name: "Daily" });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/v1/streak", () => {
    it("should return paginated streaks", async () => {
      const { token } = await setupUser();
      await createStreak(token, { name: "S1" });
      await createStreak(token, { name: "S2" });
      const res = await request(app).get("/api/v1/streak").set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.docs).toHaveLength(2);
    });
  });

  describe("GET /api/v1/streak/:id", () => {
    it("should return a single streak", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token)).body.data._id;
      const res = await request(app).get(`/api/v1/streak/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("100 Days of Code");
    });

    it("should return 404 for non-existent", async () => {
      const { token } = await setupUser();
      const res = await request(app).get("/api/v1/streak/507f1f77bcf86cd799439011").set(authHeader(token));
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/streak/:id/complete", () => {
    it("should mark day 1 as complete", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Mark Test" })).body.data._id;
      const res = await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token))
        .send({ streakValue: 1, note: "Day 1!" });
      expect(res.status).toBe(200);
      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.longestStreak).toBe(1);
    });

    it("should reject without streakValue", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "No Val" })).body.data._id;
      const res = await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token)).send({});
      expect(res.status).toBe(400);
    });

    it("should reject out-of-order completion", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Order" })).body.data._id;
      const res = await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token))
        .send({ streakValue: 2 });
      expect(res.status).toBe(400);
    });

    it("should reject completing same day twice", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Twice" })).body.data._id;
      await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token)).send({ streakValue: 1 });
      const res = await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token)).send({ streakValue: 2 });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/streak/:id/can-complete", () => {
    it("should return canComplete=true for fresh streak", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Fresh" })).body.data._id;
      const res = await request(app).get(`/api/v1/streak/${id}/can-complete`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.canComplete).toBe(true);
    });

    it("should return canComplete=false after completing today", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Done" })).body.data._id;
      await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token)).send({ streakValue: 1 });
      const res = await request(app).get(`/api/v1/streak/${id}/can-complete`).set(authHeader(token));
      expect(res.body.data.canComplete).toBe(false);
    });
  });

  describe("GET /api/v1/streak/:id/stats", () => {
    it("should return correct stats", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Stats", targetDays: 10 })).body.data._id;
      await request(app).post(`/api/v1/streak/${id}/complete`).set(authHeader(token)).send({ streakValue: 1 });
      const res = await request(app).get(`/api/v1/streak/${id}/stats`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.totalDays).toBe(10);
      expect(res.body.data.completedDays).toBe(1);
    });
  });

  describe("DELETE /api/v1/streak/:id", () => {
    it("should delete a streak", async () => {
      const { token } = await setupUser();
      const id = (await createStreak(token, { name: "Del" })).body.data._id;
      expect((await request(app).delete(`/api/v1/streak/${id}`).set(authHeader(token))).status).toBe(200);
      expect((await request(app).get(`/api/v1/streak/${id}`).set(authHeader(token))).status).toBe(404);
    });
  });

  describe("User Isolation", () => {
    it("User A should NOT see User B's streaks", async () => {
      const a = await setupUser({ email: "a@s.com" });
      const b = await setupUser({ email: "b@s.com" });
      await createStreak(a.token, { name: "A's" });
      const res = await request(app).get("/api/v1/streak").set(authHeader(b.token));
      expect(res.body.data.docs).toHaveLength(0);
    });
  });
});
