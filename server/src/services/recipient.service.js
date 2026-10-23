import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import { maskAccountNumber } from "../utils/ids.js";

// Never put raw user input into a RegExp: "a.*" would match everyone
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function searchRecipients(currentUserId, q) {
  const needle = q.trim();
  const wordPrefix = new RegExp(`(^|\\s)${escapeRegex(needle)}`, "i"); // start of any word in the name

  const users = await User.find({
    _id: { $ne: currentUserId }, // never list yourself
    role: "CUSTOMER",
    status: "ACTIVE",
    $or: [{ name: wordPrefix }, { email: needle.toLowerCase() }], // name = prefix, email = EXACT only
  })
    .select("name")
    .limit(20)
    .lean();
  if (users.length === 0) return [];

  const accounts = await Account.find({
    userId: { $in: users.map((u) => u._id) },
    status: "ACTIVE",
  })
    .select("userId accountNumber")
    .lean();
  const byUser = new Map(accounts.map((a) => [String(a.userId), a]));

  return users
    .filter((u) => byUser.has(String(u._id)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8)
    .map((u) => {
      const a = byUser.get(String(u._id));
      // ONLY these three fields: no email, no user id, no full account number (decision D-18)
      return { accountId: String(a._id), name: u.name, maskedAccountNumber: maskAccountNumber(a.accountNumber) };
    });
}
