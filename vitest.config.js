import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use the global setup file for in-memory MongoDB
    globalSetup: "./tests/setup.js",
    // Timeout per test (in-memory DB can be slow to start the first time)
    testTimeout: 15000,
    // Run test files sequentially to avoid DB conflicts
    fileParallelism: false,
  },
});
