import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import LoginForm from "../components/LoginForm";
import { selectNotice } from "../authSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const notice = useSelector(selectNotice);
  const location = useLocation();
  const registered = Boolean(location.state?.registered);

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Log in to see your balance and send money.</p>
      </div>

      {registered && (
        <Alert role="status" className="border-success/30 bg-success-soft text-success">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <AlertDescription className="font-medium">Account created! Log in with your email and password.</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert role="status">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <LoginForm defaultEmail={location.state?.email ?? ""} />
      <p className="text-center text-sm text-muted-foreground">
        New to Bytebank?{" "}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
