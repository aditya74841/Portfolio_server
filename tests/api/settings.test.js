/**
 * API Integration Tests: Settings & Profile
 * Tests for changing password, setting/verifying PIN, and updating profile.
 */

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { connectTestDB, clearDatabase, createTestUser, getAuthToken, authHeader } from "../helpers.js";

describe("Settings & Profile API", () => {
  beforeAll(async () => { await connectTestDB(); });
  afterEach(async () => { await clearDatabase(); });

  async function setupUser(overrides = {}) {
    const user = await createTestUser({ password: "oldpassword", ...overrides });
    return { user, token: getAuthToken(user) };
  }

  describe("Authentication", () => {
    it("should return 401 without a token", async () => {
      expect((await request(app).put("/api/v1/auth/change-password")).status).toBe(401);
    });
  });

  // ─── PUT /api/v1/auth/update-profile ────────────────────────────────

  describe("PUT /api/v1/auth/update-profile", () => {
    it("should update user name", async () => {
      const { token } = await setupUser({ name: "Old Name" });
      const res = await request(app).put("/api/v1/auth/update-profile").set(authHeader(token))
        .send({ name: "New Name" });
      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe("New Name");
    });

    it("should reject without a name", async () => {
      const { token } = await setupUser();
      const res = await request(app).put("/api/v1/auth/update-profile").set(authHeader(token))
        .send({ name: "" });
      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/v1/auth/change-password ───────────────────────────────

  describe("PUT /api/v1/auth/change-password", () => {
    it("should change password with correct current password", async () => {
      const { user, token } = await setupUser({ password: "oldpassword123" });
      const res = await request(app).put("/api/v1/auth/change-password").set(authHeader(token))
        .send({ currentPassword: "oldpassword123", newPassword: "newpassword123" });
      expect(res.status).toBe(200);

      // Verify login with new password works
      const loginRes = await request(app).post("/api/v1/auth/email-login").send({
        email: user.email,
        password: "newpassword123",
      });
      expect(loginRes.status).toBe(200);
    });

    it("should reject with incorrect current password", async () => {
      const { token } = await setupUser({ password: "oldpassword123" });
      const res = await request(app).put("/api/v1/auth/change-password").set(authHeader(token))
        .send({ currentPassword: "wrongpassword", newPassword: "newpassword123" });
      expect(res.status).toBe(401);
    });

    it("should reject new password under 6 characters", async () => {
      const { token } = await setupUser({ password: "oldpassword123" });
      const res = await request(app).put("/api/v1/auth/change-password").set(authHeader(token))
        .send({ currentPassword: "oldpassword123", newPassword: "123" });
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/v1/auth/set-pin ──────────────────────────────────────

  describe("POST /api/v1/auth/set-pin", () => {
    it("should set a 4-digit PIN", async () => {
      const { token } = await setupUser();
      const res = await request(app).post("/api/v1/auth/set-pin").set(authHeader(token))
        .send({ pin: "1234" });
      expect(res.status).toBe(200);

      // Verify via checkPinSession
      const checkRes = await request(app).get("/api/v1/auth/pin-session").set(authHeader(token));
      expect(checkRes.body.data.hasPin).toBe(true);
    });

    it("should reject invalid PIN formats", async () => {
      const { token } = await setupUser();
      
      const res1 = await request(app).post("/api/v1/auth/set-pin").set(authHeader(token)).send({ pin: "123" });
      expect(res1.status).toBe(400); // too short

      const res2 = await request(app).post("/api/v1/auth/set-pin").set(authHeader(token)).send({ pin: "12345" });
      expect(res2.status).toBe(400); // too long

      const res3 = await request(app).post("/api/v1/auth/set-pin").set(authHeader(token)).send({ pin: "12a4" });
      expect(res3.status).toBe(400); // not digits
    });
  });

  // ─── POST /api/v1/auth/verify-pin ───────────────────────────────────

  describe("POST /api/v1/auth/verify-pin", () => {
    it("should verify correct PIN and start a session", async () => {
      const { token } = await setupUser();
      await request(app).post("/api/v1/auth/set-pin").set(authHeader(token)).send({ pin: "4321" });

      const res = await request(app).post("/api/v1/auth/verify-pin").set(authHeader(token))
        .send({ pin: "4321" });
      expect(res.status).toBe(200);
      expect(res.body.data.pinSessionExpiresAt).toBeDefined();
    });

    it("should reject incorrect PIN", async () => {
      const { token } = await setupUser();
      await request(app).post("/api/v1/auth/set-pin").set(authHeader(token)).send({ pin: "4321" });

      const res = await request(app).post("/api/v1/auth/verify-pin").set(authHeader(token))
        .send({ pin: "0000" });
      expect(res.status).toBe(401);
    });

    it("should reject if no PIN has been set", async () => {
      const { token } = await setupUser();
      // No PIN set yet
      const res = await request(app).post("/api/v1/auth/verify-pin").set(authHeader(token))
        .send({ pin: "1234" });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No PIN has been set");
    });
  });

  // ─── GET /api/v1/auth/pin-session ───────────────────────────────────

  describe("GET /api/v1/auth/pin-session", () => {
    it("should return pin session status", async () => {
      const { token } = await setupUser();
      const res = await request(app).get("/api/v1/auth/pin-session").set(authHeader(token));
      
      expect(res.status).toBe(200);
      expect(res.body.data.hasPin).toBeDefined();
      expect(res.body.data.isValid).toBeDefined();
    });
  });
});
