import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/user.model.js";
import { Account } from "../src/models/account.model.js";
import { provisionAccount } from "../src/services/account.service.js";

await connectDB();

const haveAccount = await Account.distinct("userId");
const users = await User.find({ role: "CUSTOMER", _id: { $nin: haveAccount } });
console.log(`Found ${users.length} customer(s) without an account`);

for (const user of users) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (await Account.exists({ userId: user._id }).session(session)) return; // safe to re-run
      await provisionAccount(user, session);
    });
    console.log(`✅ ${user.email}`);
  } catch (err) {
    console.error(`❌ ${user.email}: ${err.message}`);
  } finally {
    await session.endSession();
  }
}

await disconnectDB();
