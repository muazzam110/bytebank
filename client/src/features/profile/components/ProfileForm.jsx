import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/api/profileApi";
import { applyServerErrors, getErrorMessage } from "@/lib/formErrors";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import FormField from "@/components/shared/FormField";
import { profileSchema } from "../schemas/profileSchemas";

export default function ProfileForm() {
  const { data: profile, isLoading, isError, error, refetch } = useGetProfileQuery();
  const [update, { isLoading: saving, error: saveError }] = useUpdateProfileMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: profile?.name ?? "" }, // refreshes when the server data changes
  });

  if (isLoading)
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="skeleton h-11 w-full" />
        <div className="skeleton h-11 w-full" />
      </div>
    );
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const onSubmit = async ({ name }) => {
    try {
      await update({ name }).unwrap();
      toast.success("Profile updated");
    } catch (err) {
      applyServerErrors(err, setError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(saveError)}</AlertDescription>
        </Alert>
      )}
      <FormField id="name" label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium leading-none">
          Email
        </label>
        <input
          id="email"
          value={profile.email}
          readOnly
          disabled
          aria-describedby="email-help"
          className="flex h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-70"
        />
        <p id="email-help" className="text-xs text-muted-foreground">
          Your email can't be changed here.
        </p>
      </div>
      <Button type="submit" disabled={saving || !isDirty}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
