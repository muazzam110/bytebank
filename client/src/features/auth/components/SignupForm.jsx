import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useSignupMutation } from "@/api/authApi";
import { signupSchema } from "../schemas/authSchemas";
import { applyServerErrors, getErrorMessage } from "@/lib/formErrors";
import FormField from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupForm() {
  const navigate = useNavigate();
  const [signup, { isLoading, error }] = useSignupMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      await signup(values).unwrap();
      navigate("/login", { state: { registered: true, email: values.email } });
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
      <FormField id="name" label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <FormField id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
        {isLoading ? "Creating your account…" : "Create my account"}
      </Button>
    </form>
  );
}
