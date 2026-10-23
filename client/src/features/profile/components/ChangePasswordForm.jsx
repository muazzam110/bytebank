import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useChangePasswordMutation } from "@/api/authApi";
import { applyServerErrors, getErrorCode, getErrorMessage } from "@/lib/formErrors";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField from "@/components/shared/FormField";
import { changePasswordSchema } from "../schemas/profileSchemas";

export default function ChangePasswordForm() {
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success("Password updated. Your other devices were signed out.");
      reset();
    } catch (err) {
      if (getErrorCode(err) === "INVALID_CURRENT_PASSWORD") {
        setError("currentPassword", { type: "server", message: "That isn't your current password." });
      } else {
        applyServerErrors(err, setError);
      }
    }
  };

  const generic = error && getErrorCode(error) !== "INVALID_CURRENT_PASSWORD" && !error?.data?.error?.details;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {generic && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}
      <FormField
        id="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <FormField
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <FormField
        id="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
