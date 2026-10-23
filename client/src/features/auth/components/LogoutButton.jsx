import { useLogout } from "../hooks/useLogout";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const { logout, isLoading } = useLogout();
  return (
    <Button variant="ghost" onClick={logout} disabled={isLoading}>
      Log out
    </Button>
  );
}
