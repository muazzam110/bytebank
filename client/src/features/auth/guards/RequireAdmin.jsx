import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../authSlice";

export default function RequireAdmin() {
  const user = useSelector(selectUser);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== "ADMIN") return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}
