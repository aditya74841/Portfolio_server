/**
 * Test Helpers
 * ------------
 * Reusable functions that every test file can import.
 * These handle the repetitive stuff: creating users, generating tokens, etc.
 */

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";

// ─── Database Helpers ────────────────────────────────────────────────

/**
 * Connect to the in-memory MongoDB (called in each test file's beforeAll).
 * The URI was set by tests/setup.js in the global setup phase.
 */
export async function connectTestDB() {
  const uri = process.env.MONGODB_TEST_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

/**
 * Drop all data from all collections.
 * Call this in afterEach() so each test starts with a clean database.
 */
export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnect from the in-memory MongoDB.
 * Call this in afterAll() to clean up.
 */
export async function disconnectTestDB() {
  await mongoose.disconnect();
}

// ─── User & Auth Helpers ─────────────────────────────────────────────

/**
 * Create a test user in the database and return the user document.
 * You can override any field by passing an object.
 *
 * Example:
 *   const user = await createTestUser({ name: "Alice", role: "admin" });
 */
export async function createTestUser(overrides = {}) {
  const defaults = {
    name: "Test User",
    email: `testuser-${Date.now()}@example.com`,
    password: "password123",
    authProvider: "email",
    role: "user",
  };

  const userData = { ...defaults, ...overrides };
  const user = await User.create(userData);
  return user;
}

/**
 * Generate a valid JWT token for a user.
 * This is the same logic your auth controller uses.
 */
export function getAuthToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "test-secret-key-for-testing-only",
    { expiresIn: "1d" }
  );
}

/**
 * Returns the Authorization header object for supertest.
 *
 * Usage with supertest:
 *   request(app).get("/api/v1/todo").set(authHeader(token))
 */
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
