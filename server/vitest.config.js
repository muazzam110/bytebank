import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 180_000, // the FIRST run downloads a mongod binary (~100MB)
    fileParallelism: false, // one in-memory database at a time
    env: {
      // satisfy env.js without touching your real .env / Atlas
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://localhost/unused-in-tests",
      JWT_SECRET: "test-secret-test-secret-test-secret-123456",
      CLIENT_ORIGIN: "http://localhost:5173",
      EMAIL_MODE: "console",
    },
  },
});
