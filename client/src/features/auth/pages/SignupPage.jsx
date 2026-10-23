import { Link } from "react-router-dom";
import SignupForm from "../components/SignupForm";

export default function SignupPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">Takes under a minute. Your ₹10,000 is waiting.</p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
