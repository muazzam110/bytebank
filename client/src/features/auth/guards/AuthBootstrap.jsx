import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetMeQuery } from "@/api/authApi";
import { selectIsHydrated } from "../authSlice";
import PageSkeleton from "@/components/shared/PageSkeleton";

export default function AuthBootstrap() {
  useGetMeQuery(); // fires once at app start; authSlice matchers hydrate Redux
  const hydrated = useSelector(selectIsHydrated);
  if (!hydrated) return <PageSkeleton />;
  return <Outlet />;
}
