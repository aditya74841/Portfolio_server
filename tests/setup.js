/**
 * Global Test Setup
 * -----------------
 * This file runs ONCE before all test files and ONCE after all test files.
 *
 * What it does:
 * 1. Starts an in-memory MongoDB server (so we never touch the real database)
 * 2. Connects Mongoose to it
 * 3. After all tests finish, disconnects and stops the server
 *
 * Vitest calls the exported `setup()` before tests and `teardown()` after.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

export async function setup() {
  // Start an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Store the URI so test files can access it
  process.env.MONGODB_TEST_URI = uri;

  // Set env vars that our app code reads
  process.env.JWT_SECRET = "test-secret-key-for-testing-only";
  process.env.NODE_ENV = "test";

  // Dummy env vars for services that validate API keys at import time.
  // These are never actually used — no real API calls are made during tests.
  process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-groq-key";
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
  process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-google-client-id";

  // Connect Mongoose to the in-memory DB
  await mongoose.connect(uri);
}

export async function teardown() {
  // Clean up: disconnect and stop the in-memory server
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
