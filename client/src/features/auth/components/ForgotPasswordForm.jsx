import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPasswordMutation } from "@/api/authApi";
import { forgotSchema } from "../schemas/authSchemas";
import { getErrorMessage } from "@/lib/formErrors";
import FormField from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordForm() {
  const [forgot, { isLoading, isSuccess, data, error }] = useForgotPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  if (isSuccess)
    return (
      <Alert>
        <AlertDescription>{data.message}</AlertDescription>
      </Alert>
    );

  return (
    <form onSubmit={handleSubmit((v) => forgot(v))} className="space-y-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}
      <FormField id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
