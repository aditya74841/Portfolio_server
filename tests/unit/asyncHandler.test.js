/**
 * Unit Tests: asyncHandler
 * ------------------------
 * Tests for the asyncHandler wrapper in utils/asyncHandler.js
 *
 * asyncHandler wraps async route handlers so that any thrown errors
 * are automatically caught and passed to Express's next() function
 * (which then triggers the error middleware).
 */

import { describe, it, expect, vi } from "vitest";
import { asyncHandler } from "../../utils/asyncHandler.js";

describe("asyncHandler", () => {
  it("should call the wrapped function with req, res, next", async () => {
    // Create a mock handler function
    const mockHandler = vi.fn().mockResolvedValue(undefined);

    // Wrap it with asyncHandler
    const wrapped = asyncHandler(mockHandler);

    // Create fake req, res, next objects
    const req = {};
    const res = {};
    const next = vi.fn();

    // Call the wrapped function
    await wrapped(req, res, next);

    // Verify the original handler was called with the right arguments
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
  });

  it("should catch errors and pass them to next()", async () => {
    // Create a handler that throws an error
    const testError = new Error("Something broke");
    const mockHandler = vi.fn().mockRejectedValue(testError);

    const wrapped = asyncHandler(mockHandler);

    const req = {};
    const res = {};
    const next = vi.fn();

    // Call it — the error should be caught, not thrown
    await wrapped(req, res, next);

    // next() should have been called with the error
    expect(next).toHaveBeenCalledWith(testError);
  });

  it("should NOT call next() when the handler succeeds", async () => {
    const mockHandler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(mockHandler);

    const req = {};
    const res = {};
    const next = vi.fn();

    await wrapped(req, res, next);

    // next() should NOT have been called (no error to pass)
    expect(next).not.toHaveBeenCalled();
  });
});
