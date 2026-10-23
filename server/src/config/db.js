import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI);

  // Transfers (Phase 3) need transactions, which need a replica set. Fail fast now.
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName) {
    throw new Error("MongoDB is not a replica set. Use MongoDB Atlas.");
  }
  logger.info(`MongoDB connected (replica set: ${hello.setName})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
