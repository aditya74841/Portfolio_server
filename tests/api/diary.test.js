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

describe("Daily Diary API", () => {
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

  describe("Authentication", () => {
    it("should return 401 for diary routes without a token", async () => {
      const res = await request(app).get("/api/v1/diary/today");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/diary/today", () => {
    it("should auto-initialize and fetch today's diary entry", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .get("/api/v1/diary/today")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.date).toBeDefined();
      expect(res.body.data.content).toBe("");
    });
  });

  describe("POST /api/v1/diary", () => {
    it("should create or update a diary entry for a date", async () => {
      const { token } = await setupUser();
      const testDate = "2026-09-04";

      const res = await request(app)
        .post("/api/v1/diary")
        .set(authHeader(token))
        .send({
          date: testDate,
          content: "<p>Today I worked on building the Daily Diary feature.</p>",
          mood: "Productive",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.date).toBe(testDate);
      expect(res.body.data.content).toContain("Daily Diary feature");
      expect(res.body.data.mood).toBe("Productive");
      expect(res.body.data.wordCount).toBe(9);
    });

    it("should update content of existing diary entry without duplicate", async () => {
      const { token } = await setupUser();
      const testDate = "2026-09-04";

      await request(app)
        .post("/api/v1/diary")
        .set(authHeader(token))
        .send({ date: testDate, content: "Initial entry" });

      const updateRes = await request(app)
        .post("/api/v1/diary")
        .set(authHeader(token))
        .send({ date: testDate, content: "Updated entry content" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.content).toBe("Updated entry content");

      // Verify range return has length 1
      const listRes = await request(app)
        .get("/api/v1/diary")
        .set(authHeader(token));

      expect(listRes.body.data).toHaveLength(1);
    });

    it("should reject invalid date formats", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/diary")
        .set(authHeader(token))
        .send({ date: "04-09-2026", content: "Invalid date format" });

      expect(res.status).toBe(400);
    });
  });

  describe("User Isolation", () => {
    it("User A cannot access or modify User B's diary entries", async () => {
      const userA = await setupUser({ email: "usera@diary.com" });
      const userB = await setupUser({ email: "userb@diary.com" });
      const testDate = "2026-09-04";

      await request(app)
        .post("/api/v1/diary")
        .set(authHeader(userA.token))
        .send({ date: testDate, content: "User A's private thoughts" });

      await request(app)
        .post("/api/v1/diary")
        .set(authHeader(userB.token))
        .send({ date: testDate, content: "User B's private thoughts" });

      const getResA = await request(app)
        .get(`/api/v1/diary/date/${testDate}`)
        .set(authHeader(userA.token));

      const getResB = await request(app)
        .get(`/api/v1/diary/date/${testDate}`)
        .set(authHeader(userB.token));

      expect(getResA.body.data.content).toBe("User A's private thoughts");
      expect(getResB.body.data.content).toBe("User B's private thoughts");
    });
  });
});
