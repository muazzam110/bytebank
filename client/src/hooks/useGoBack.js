import { useLocation, useNavigate } from "react-router-dom";

// location.key is "default" only for the very first entry of this tab (deep link) → use the fallback then
export function useGoBack(fallback) {
  const navigate = useNavigate();
  const { key } = useLocation();
  return () => (key !== "default" ? navigate(-1) : navigate(fallback));
}
