import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";

const FIELDS = "name email role status createdAt";
const toProfile = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt,
});
const gone = () => new AppError("UNAUTHENTICATED", 401, "Please log in.");

export async function getProfile(userId) {
  const user = await User.findById(userId).select(FIELDS).lean();
  if (!user) throw gone();
  return toProfile(user);
}

// Only `name` is editable. Old receipts keep the name they were created with (decision D-16).
export async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(userId, { $set: { name } }, { new: true, runValidators: true })
    .select(FIELDS)
    .lean();
  if (!user) throw gone();
  return toProfile(user);
}
