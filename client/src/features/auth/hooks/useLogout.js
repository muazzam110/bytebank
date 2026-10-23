import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { baseApi } from "@/api/baseApi";
import { useLogoutMutation } from "@/api/authApi";

export function useLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutRequest, { isLoading }] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutRequest().unwrap();
    } catch {
      /* cookie may already be gone */
    }
    dispatch(baseApi.util.resetApiState()); // wipe cached private data
    navigate("/login", { replace: true });
  };

  return { logout, isLoading };
}
