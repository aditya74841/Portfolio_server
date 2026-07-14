/**
 * API Integration Tests: Auth
 * ----------------------------
 * These tests send REAL HTTP requests to our Express app using Supertest.
 * The database is an in-memory MongoDB, so nothing touches your real data.
 *
 * This is the "full stack" test — request goes through:
 *   HTTP → Express → Routes → Middleware → Controller → Mongoose → In-memory MongoDB
 *   ...and the response comes back the same way.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import {
  connectTestDB,
  clearDatabase,
  createTestUser,
  getAuthToken,
  authHeader,
} from "../helpers.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  // Note: no afterAll disconnect — global teardown handles it

  // ─── POST /api/v1/auth/register ─────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Aditya",
        email: "aditya@example.com",
        password: "securepass123",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe("Aditya");
      expect(res.body.data.user.email).toBe("aditya@example.com");
      expect(res.body.data.token).toBeDefined();
      // Password should NEVER be in the response
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should reject registration without a name", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "noname@example.com",
        password: "securepass123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject registration without an email", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "No Email",
        password: "securepass123",
      });

      expect(res.status).toBe(400);
    });

    it("should reject registration with a short password", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Short Pass",
        email: "short@example.com",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("6 characters");
    });

    it("should reject duplicate email registration", async () => {
      // Register the first user
      await request(app).post("/api/v1/auth/register").send({
        name: "First User",
        email: "duplicate@example.com",
        password: "securepass123",
      });

      // Try to register with the same email
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Second User",
        email: "duplicate@example.com",
        password: "securepass123",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });
  });

  // ─── POST /api/v1/auth/email-login ────────────────────────────────────────

  describe("POST /api/v1/auth/email-login", () => {
    it("should login with correct credentials", async () => {
      // First, create a user
      await createTestUser({
        email: "login@example.com",
        password: "securepass123",
      });

      const res = await request(app).post("/api/v1/auth/email-login").send({
        email: "login@example.com",
        password: "securepass123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("login@example.com");
    });

    it("should reject login with wrong password", async () => {
      await createTestUser({
        email: "wrongpass@example.com",
        password: "correctpassword",
      });

      const res = await request(app).post("/api/v1/auth/email-login").send({
        email: "wrongpass@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject login for non-existent user", async () => {
      const res = await request(app).post("/api/v1/auth/email-login").send({
        email: "ghost@example.com",
        password: "doesntmatter",
      });

      expect(res.status).toBe(401);
    });

    it("should reject login without email or password", async () => {
      const res = await request(app).post("/api/v1/auth/email-login").send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/v1/auth/me ────────────────────────────────────────────

  describe("GET /api/v1/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const user = await createTestUser({ email: "me@example.com" });
      const token = getAuthToken(user);

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("me@example.com");
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/v1/auth/logout ───────────────────────────────────────

  describe("POST /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      const user = await createTestUser();
      const token = getAuthToken(user);

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Logged out");
    });
  });
});
