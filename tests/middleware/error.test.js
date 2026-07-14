/**
 * Middleware Tests: errorHandler
 * ------------------------------
 * Tests for the global error-handling middleware.
 *
 * These tests create MOCK req/res/next objects — we don't need a real
 * HTTP server to test middleware. We just call the function directly
 * and check what it does to the response.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { errorHandler } from "../../middlewares/error.middlewares.js";
import { ApiError } from "../../utils/ApiError.js";

// Helper: create a mock Express response object
function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    // .status() returns `res` so you can chain .json()
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe("errorHandler middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = createMockRes();
    next = vi.fn();
  });

  it("should handle ApiError and return the correct status + message", () => {
    const error = new ApiError(404, "Todo not found");

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Todo not found");
  });

  it("should convert a generic Error to a 500 response", () => {
    const error = new Error("Something unexpected happened");

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Something unexpected happened");
  });

  it("should convert a Mongoose ValidationError to a 400 response", () => {
    // Create a real Mongoose validation error
    const error = new mongoose.Error.ValidationError();
    error.message = "Validation failed";

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should include stack trace in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const error = new ApiError(500, "Server error");

    errorHandler(error, req, res, next);

    expect(res.body.stack).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("should NOT include stack trace in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const error = new ApiError(500, "Server error");

    errorHandler(error, req, res, next);

    expect(res.body.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});
