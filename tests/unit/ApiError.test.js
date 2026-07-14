/**
 * Unit Tests: ApiError
 * --------------------
 * Tests for the custom ApiError class in utils/ApiError.js
 *
 * These are "unit tests" — they test a single piece of code in isolation.
 * No database, no HTTP requests, just pure JavaScript.
 */

import { describe, it, expect } from "vitest";
import { ApiError } from "../../utils/ApiError.js";

describe("ApiError", () => {
  it("should create an error with the correct statusCode and message", () => {
    const error = new ApiError(404, "Not found");

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
  });

  it("should always have success = false", () => {
    const error = new ApiError(500, "Server error");

    expect(error.success).toBe(false);
  });

  it("should use default message when none is provided", () => {
    const error = new ApiError(500);

    expect(error.message).toBe("Something went wrong");
  });

  it("should be an instance of Error (so it works with try/catch)", () => {
    const error = new ApiError(400, "Bad request");

    expect(error).toBeInstanceOf(Error);
  });

  it("should capture a stack trace", () => {
    const error = new ApiError(500, "Server error");

    expect(error.stack).toBeDefined();
    expect(error.stack.length).toBeGreaterThan(0);
  });

  it("should store additional errors array", () => {
    const validationErrors = [
      { field: "email", message: "Invalid email" },
    ];
    const error = new ApiError(400, "Validation failed", validationErrors);

    expect(error.errors).toEqual(validationErrors);
  });

  it("should have data = null by default", () => {
    const error = new ApiError(400, "Bad request");

    expect(error.data).toBeNull();
  });
});
