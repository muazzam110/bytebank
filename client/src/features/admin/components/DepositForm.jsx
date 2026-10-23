import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { useCreateDepositMutation, useGetAdminUserQuery } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/formErrors";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "@/components/shared/CopyButton";
import ProcessingOverlay from "@/features/transfer/components/ProcessingOverlay";
import { depositSchema } from "../schemas/adminSchemas";
import CustomerCombobox from "./CustomerCombobox";
import DepositReviewDialog from "./DepositReviewDialog";

const OBJECT_ID = /^[a-f\d]{24}$/i;
const DEPOSIT_STEPS = [
  { text: "Verifying admin permissions" },
  { text: "Checking the customer's account" },
  { text: "Crediting the account" },
  { text: "Recording in the ledger" },
  { text: "Writing the audit log" }, // ← only after the server has answered
];
// "We don't KNOW what happened": network down, timeout, or a 5xx
const isUnknown = (e) =>
  ["FETCH_ERROR", "TIMEOUT_ERROR", "PARSING_ERROR"].includes(e?.status) || (typeof e?.status === "number" && e.status >= 500);

export default function DepositForm() {
  const [params] = useSearchParams();
  const prefillId = params.get("userId") ?? "";
  const { data: prefill } = useGetAdminUserQuery(prefillId, { skip: !OBJECT_ID.test(prefillId) });

  const [customer, setCustomer] = useState(null);
  const [customerError, setCustomerError] = useState("");
  const [review, setReview] = useState(null); // validated values awaiting confirmation
  const [overlay, setOverlay] = useState(false);
  const [settled, setSettled] = useState(false);
  const [createDeposit, { data: deposit, error, isSuccess, isError, reset: resetMutation }] = useCreateDepositMutation();
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: "", reason: "" },
  });

  // arriving from a user's detail page (?userId=…) preselects that customer
  useEffect(() => {
    if (prefill?.user && !customer) setCustomer(prefill.user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const onSubmit = (values) => {
    if (!customer) return setCustomerError("Choose a customer.");
    if (customer.status !== "ACTIVE") {
      return setCustomerError("This customer is suspended, so they can't receive deposits.");
    }
    setCustomerError("");
    setReview({ customer, amount: values.amount.trim(), reason: values.reason.trim() });
  };

  const confirm = async () => {
    setSettled(false);
    setOverlay(true);
    try {
      await createDeposit({ userId: review.customer.id, amount: review.amount, reason: review.reason }).unwrap();
    } catch {
      /* the result view reads the error from the mutation hook */
    } finally {
      setSettled(true);
    }
  };

  const backToForm = () => {
    resetMutation();
    setReview(null);
  }; // keeps what was typed
  const startAnother = () => {
    resetMutation();
    setReview(null);
    resetForm();
    setCustomer(null);
  };

  const showResult = !overlay && (isSuccess || isError);

  if (showResult && isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 tabIndex={-1} ref={(el) => el?.focus()} className="font-display text-2xl font-semibold outline-none">
          {formatINR(deposit.amountPaise)} deposited to {deposit.target.name}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <code className="font-mono text-xs tracking-wide text-foreground/80">{deposit.paymentId}</code>
          <CopyButton value={deposit.paymentId} label="Copy payment ID" />
        </div>
        <p className="text-sm text-muted-foreground">Recorded in the ledger and the audit log. The customer sees it within 30 seconds.</p>
        <Button onClick={startAnother}>Make another deposit</Button>
      </div>
    );
  }

  if (showResult && isError) {
    const unknown = isUnknown(error);
    return (
      <div role="alert" className={`space-y-4 rounded-2xl border bg-card p-5 ${unknown ? "border-warning/40" : "border-danger/40"}`}>
        <h2 tabIndex={-1} ref={(el) => el?.focus()} className="font-display text-xl font-semibold outline-none">
          {unknown ? "We couldn't confirm this deposit" : "The deposit was not made"}
        </h2>
        {unknown ? (
          <p className="text-sm text-foreground/80">
            Check <strong>Deposit history</strong> below before trying again. If it went through, a second attempt would deposit twice.
          </p>
        ) : (
          <>
            <p className="text-sm text-foreground/80">{getErrorMessage(error)}</p>
            <p className="text-sm font-medium text-foreground">No money was moved.</p>
          </>
        )}
        <Button onClick={backToForm}>{unknown ? "Back to the form" : "Edit deposit"}</Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <CustomerCombobox
          value={customer}
          onChange={(u) => {
            setCustomer(u);
            setCustomerError("");
          }}
          error={customerError}
        />

        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="2500.00"
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "amount-error" : undefined}
            className="tabular-nums"
            {...register("amount")}
          />
          {errors.amount && (
            <p id="amount-error" role="alert" className="text-xs text-danger">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason (required)</Label>
          <Textarea
            id="reason"
            rows={3}
            maxLength={200}
            placeholder="e.g. Welcome bonus"
            aria-invalid={Boolean(errors.reason)}
            aria-describedby="reason-help"
            {...register("reason")}
          />
          <p id="reason-help" role={errors.reason ? "alert" : undefined} className={errors.reason ? "text-xs text-danger" : "text-xs text-muted-foreground"}>
            {errors.reason?.message ?? "Saved in the audit log and shown to the customer in their transaction details."}
          </p>
        </div>

        <Button type="submit" className="w-full sm:w-auto">
          Review deposit
        </Button>
      </form>

      {/* the review dialog closes the moment the loader takes over */}
      <DepositReviewDialog review={overlay ? null : review} onCancel={() => setReview(null)} onConfirm={confirm} />
      {overlay && <ProcessingOverlay settled={settled} onDone={() => setOverlay(false)} title="Recording the deposit" steps={DEPOSIT_STEPS} />}
    </>
  );
}
