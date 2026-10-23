import { motion } from "motion/react";
import { Copy } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { getErrorCode, getErrorMessage } from "@/lib/formErrors";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import Money from "@/components/shared/Money";
import StepHeading from "./StepHeading";

// code → what to tell the person and where to send them next
const FAILURES = {
  INSUFFICIENT_FUNDS: { title: "Not enough balance", next: "amount" },
  INVALID_AMOUNT: { title: "That amount isn't allowed", next: "amount" },
  VALIDATION_ERROR: { title: "Please check your details", next: "amount" },
  SELF_TRANSFER: { title: "That's your own account", next: "recipient" },
  RECIPIENT_INELIGIBLE: { title: "This person can't receive money right now", next: "recipient" },
  IDEMPOTENCY_CONFLICT: { title: "This attempt can't be reused", next: "restart" },
  RATE_LIMITED: { title: "Too many attempts", next: "retry" },
};

// "We don't KNOW what happened": network down, timeout, or a 5xx
const isUnknown = (error) =>
  ["FETCH_ERROR", "TIMEOUT_ERROR", "PARSING_ERROR"].includes(error?.status) ||
  (typeof error?.status === "number" && error.status >= 500);

function CheckDraw({ reduced }) {
  return (
    <svg viewBox="0 0 52 52" className="h-16 w-16 text-success" aria-hidden="true">
      <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <motion.path
        d="M15 27l8 8 14-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function ResultCard({
  data,
  error,
  isSuccess,
  onSendAnother,
  onDone,
  onRetry,
  onChangeAmount,
  onChooseRecipient,
  onStartOver,
}) {
  const reduced = useReducedEffects();
  const balanceHidden = useSelector((s) => s.ui.balanceHidden);

  if (isSuccess) {
    const { payment, newBalancePaise, replayed } = data;
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(payment.paymentId);
        toast.success("Payment ID copied");
      } catch {
        toast.error("Couldn't copy. Select the ID and copy it manually.");
      }
    };
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckDraw reduced={reduced} />
        </div>
        <StepHeading>
          {formatINR(payment.amountPaise)} sent to {payment.recipient.name}
        </StepHeading>
        <Money paise={payment.amountPaise} size="display" />
        {replayed && (
          <p role="note" className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground/80">
            This payment had already gone through. This is the original. Nothing was sent twice.
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <code className="font-mono text-xs tracking-wide text-foreground/80">{payment.paymentId}</code>
          <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label="Copy payment ID">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">New balance: {balanceHidden ? "••••••" : formatINR(newBalancePaise)}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={onSendAnother}>
            Send another
          </Button>
          <Button asChild variant="secondary">
            <Link to={`/app/transactions/${payment.paymentId}/receipt`}>View receipt</Link>
          </Button>
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  // ── failure ──
  if (isUnknown(error)) {
    return (
      <div role="alert" className="space-y-5 rounded-2xl border border-warning/40 bg-card p-6">
        <StepHeading>We couldn't confirm your payment</StepHeading>
        <p className="text-sm text-foreground/80">
          Check your recent activity on the dashboard before sending again. If the first attempt did go through, trying again is safe: it
          won't pay twice.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onRetry}>Try again (safe)</Button>
          <Button asChild variant="secondary">
            <Link to="/app/dashboard">Check recent activity</Link>
          </Button>
        </div>
      </div>
    );
  }

  const code = getErrorCode(error);
  const f = FAILURES[code] ?? { title: "We couldn't send this payment", next: "restart" };
  return (
    <div role="alert" className="border-glow-danger space-y-5 rounded-2xl bg-card p-6">
      <StepHeading>{f.title}</StepHeading>
      <p className="text-sm text-foreground/80">{getErrorMessage(error)}</p>
      <p className="text-sm font-medium text-foreground">No money was moved.</p>
      <div className="flex flex-wrap gap-3">
        {f.next === "amount" && <Button onClick={onChangeAmount}>Change amount</Button>}
        {f.next === "recipient" && <Button onClick={onChooseRecipient}>Choose another recipient</Button>}
        {f.next === "retry" && <Button onClick={onRetry}>Try again</Button>}
        {f.next === "restart" && <Button onClick={onStartOver}>Start a new transfer</Button>}
        {f.next !== "restart" && (
          <Button variant="ghost" onClick={onStartOver}>
            Start over
          </Button>
        )}
      </div>
    </div>
  );
}
