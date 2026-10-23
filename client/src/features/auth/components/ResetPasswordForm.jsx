import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "@/api/authApi";
import { resetSchema } from "../schemas/authSchemas";
import { applyServerErrors, getErrorMessage } from "@/lib/formErrors";
import FormField from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordForm() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [reset, { isLoading, isSuccess, error }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "" },
  });

  if (!token)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          This reset link is missing its token.{" "}
          <Link to="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  if (isSuccess)
    return (
      <Alert>
        <AlertDescription>
          Password updated.{" "}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </AlertDescription>
      </Alert>
    );

  const onSubmit = async ({ newPassword }) => {
    try {
      await reset({ token, newPassword }).unwrap();
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
      <FormField
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
