import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../authSlice";

export default function GuestOnly() {
  const user = useSelector(selectUser);
  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin/overview" : "/app/dashboard"} replace />;
  return <Outlet />;
}
