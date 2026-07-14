/**
 * Middleware Tests: auth (protect & adminOnly)
 * ---------------------------------------------
 * Tests for the authentication middleware.
 *
 * These tests use the IN-MEMORY DATABASE because the `protect` middleware
 * looks up a user from MongoDB via User.findById(). So we need real
 * User documents in the database.
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { protect, adminOnly } from "../../middlewares/auth.middleware.js";
import { connectTestDB, clearDatabase, createTestUser } from "../helpers.js";

// Helper: create mock req/res/next
function createMocks(overrides = {}) {
  return {
    req: {
      headers: {},
      cookies: {},
      ...overrides,
    },
    res: {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    },
    next: vi.fn(),
  };
}

describe("Auth Middleware", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  // Note: we do NOT disconnect in afterAll here. The global teardown
  // (tests/setup.js) handles final disconnection. Disconnecting in
  // individual test files would break subsequent test files.

  // ─── protect middleware ──────────────────────────────────────────────

  describe("protect", () => {
    it("should reject requests with no token (calls next with 401 error)", async () => {
      const { req, res, next } = createMocks();

      // protect is wrapped in asyncHandler, which returns a function
      // that returns a Promise. We need to await it.
      const handler = protect;
      await new Promise((resolve) => {
        const mockNext = (err) => {
          next(err);
          resolve();
        };
        handler(req, res, mockNext);
      });

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain("no token");
    });

    it("should reject requests with an invalid token", async () => {
      const { req, res, next } = createMocks({
        headers: { authorization: "Bearer invalid-token-here" },
      });

      await new Promise((resolve) => {
        const mockNext = (err) => {
          next(err);
          resolve();
        };
        protect(req, res, mockNext);
      });

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it("should extract token from Authorization header and set req.user", async () => {
      // Create a real user in the in-memory DB
      const user = await createTestUser();
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "test-secret-key-for-testing-only"
      );

      const { req, res, next } = createMocks({
        headers: { authorization: `Bearer ${token}` },
      });

      await new Promise((resolve) => {
        const mockNext = (err) => {
          next(err);
          resolve();
        };
        protect(req, res, mockNext);
      });

      // next() should have been called WITHOUT an error (meaning success)
      // When protect succeeds, it calls next() with no arguments
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined(); // no error passed
      // req.user should now be set
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
    });

    it("should extract token from cookies", async () => {
      const user = await createTestUser();
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "test-secret-key-for-testing-only"
      );

      const { req, res, next } = createMocks({
        cookies: { token },
      });

      await new Promise((resolve) => {
        const mockNext = (err) => {
          next(err);
          resolve();
        };
        protect(req, res, mockNext);
      });

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined();
      expect(req.user).toBeDefined();
    });
  });

  // ─── adminOnly middleware ────────────────────────────────────────────

  describe("adminOnly", () => {
    it("should allow admin users through", () => {
      const { req, res, next } = createMocks();
      req.user = { role: "admin" };

      adminOnly(req, res, next);

      // next() called without arguments = success
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject non-admin users with 403", () => {
      const { req, res, next } = createMocks();
      req.user = { role: "user" };

      // adminOnly throws an ApiError, so we need to catch it
      expect(() => adminOnly(req, res, next)).toThrow();
    });
  });
});
