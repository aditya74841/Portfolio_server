/**
 * Unit Tests: ApiResponse
 * -----------------------
 * Tests for the custom ApiResponse class in utils/ApiResponse.js
 */

import { describe, it, expect } from "vitest";
import { ApiResponse } from "../../utils/ApiResponse.js";

describe("ApiResponse", () => {
  it("should create a response with statusCode, data, and message", () => {
    const data = { name: "Test Todo" };
    const response = new ApiResponse(200, data, "Success");

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual(data);
    expect(response.message).toBe("Success");
  });

  it("should set success = true for status codes below 400", () => {
    expect(new ApiResponse(200, {}).success).toBe(true);
    expect(new ApiResponse(201, {}).success).toBe(true);
    expect(new ApiResponse(204, {}).success).toBe(true);
    expect(new ApiResponse(399, {}).success).toBe(true);
  });

  it("should set success = false for status codes 400 and above", () => {
    expect(new ApiResponse(400, {}).success).toBe(false);
    expect(new ApiResponse(404, {}).success).toBe(false);
    expect(new ApiResponse(500, {}).success).toBe(false);
  });

  it("should use default message when none is provided", () => {
    const response = new ApiResponse(200, {});

    expect(response.message).toBe("Success");
  });
});
