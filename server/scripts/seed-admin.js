import { env } from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/user.model.js";
import { hashPassword } from "../src/services/auth.service.js";

if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
  console.error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in .env");
  process.exit(1);
}

await connectDB();
const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD);

await User.findOneAndUpdate(
  { email: env.ADMIN_SEED_EMAIL.toLowerCase() },
  {
    $set: {
      name: "Bytebank Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

console.log(`✅ Admin ready: ${env.ADMIN_SEED_EMAIL}`);
await disconnectDB();
