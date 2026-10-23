import ResetPasswordForm from "../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Choose a new password</h1>
      <ResetPasswordForm />
    </div>
  );
}
