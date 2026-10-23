import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/api/authApi";
import { loginSchema } from "../schemas/authSchemas";
import { applyServerErrors, getErrorMessage } from "@/lib/formErrors";
import FormField from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginForm({ defaultEmail = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: "" },
  });

  const onSubmit = async (values) => {
    try {
      const { user } = await login(values).unwrap();
      const fallback = user.role === "ADMIN" ? "/admin/overview" : "/app/dashboard";
      navigate(location.state?.from ?? fallback, { replace: true });
    } catch (err) {
      applyServerErrors(err, setError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}
      <FormField id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
        {isLoading ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center text-sm">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
