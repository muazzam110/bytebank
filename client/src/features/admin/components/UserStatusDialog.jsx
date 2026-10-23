import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSetUserStatusMutation } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/formErrors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// `user` = the customer to change, or null when closed. Radix focuses CANCEL first, as DESIGN requires.
export default function UserStatusDialog({ user, onClose }) {
  const [setStatus, { isLoading }] = useSetUserStatusMutation();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setNote("");
    setError("");
  }, [user?.id]);

  const suspending = user?.status === "ACTIVE";
  const name = user?.name ?? "";

  const confirm = async (e) => {
    e.preventDefault(); // AlertDialogAction closes the dialog by itself; we close ONLY after the server answers
    try {
      await setStatus({ id: user.id, status: suspending ? "SUSPENDED" : "ACTIVE", note: note.trim() }).unwrap();
      toast.success(suspending ? `${name} was suspended` : `${name} was reactivated`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{suspending ? `Suspend ${name}?` : `Reactivate ${name}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {suspending
              ? "They will be signed out on their next action, can't log in, and can't send or receive money. Their balance is kept and you can reverse this at any time."
              : "They will be able to log in, send and receive money again."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="status-note">Internal note (optional)</Label>
          <Textarea
            id="status-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Why? (saved in the audit log)"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={isLoading}
            className={suspending ? "bg-danger text-white hover:bg-danger/90" : ""} // red ONLY for suspend
          >
            {isLoading ? "Saving…" : suspending ? "Suspend account" : "Reactivate account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
