import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetAccountQuery } from "@/api/accountApi";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { formatINR, maskAccount, rupeesStringToPaise } from "@/lib/money";
import { Button } from "@/components/ui/button";
import Money from "@/components/shared/Money";
import { CanvasRevealEffect } from "@/components/aceternity/canvas-reveal-effect";
import { goToStep } from "../transferDraftSlice";
import { LARGE_TRANSFER_PAISE } from "../schemas/transferSchemas";
import StepHeading from "./StepHeading";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

export default function ReviewStep({ onConfirm, submitting }) {
  const dispatch = useDispatch();
  const reduced = useReducedEffects();
  const { recipient, amountInput, description } = useSelector((s) => s.transferDraft);
  const { data: account } = useGetAccountQuery();
  const [armed, setArmed] = useState(false); // hover/focus on the "commit zone"

  const paise = rupeesStringToPaise(amountInput.trim().replace(/\.$/, ""));
  useEffect(() => {
    if (paise === null) dispatch(goToStep(2));
  }, [paise, dispatch]); // never review an invalid draft
  if (paise === null) return null;

  return (
    <div className="space-y-6">
      <StepHeading>Review your transfer</StepHeading>

      <div className="text-center">
        <Money paise={paise} size="display" />
      </div>

      <dl className="divide-y divide-border rounded-2xl border border-border bg-muted px-4">
        <Row label="From">
          You {account && <span className="font-mono text-xs text-muted-foreground">A/C {maskAccount(account.accountNumber)}</span>}
        </Row>
        <Row label="To">
          {recipient.name} <span className="font-mono text-xs text-muted-foreground">{recipient.maskedAccountNumber}</span>
        </Row>
        <Row label="Amount">{formatINR(paise)}</Row>
        {description.trim() && <Row label="Note">{description.trim()}</Row>}
      </dl>

      {paise >= LARGE_TRANSFER_PAISE && (
        <p role="note" className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          This is a larger amount. Take a moment to check the recipient before you confirm.
        </p>
      )}

      {/* The "commit zone": dots reveal on hover/focus. Only ONE canvas, and none when effects are reduced */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-muted p-4"
        onMouseEnter={() => setArmed(true)}
        onMouseLeave={() => setArmed(false)}
        onFocus={() => setArmed(true)}
        onBlur={() => setArmed(false)}
      >
        {!reduced && <CanvasRevealEffect active={armed} />}
        <div className="relative z-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => dispatch(goToStep(2))} disabled={submitting}>
            Back
          </Button>
          <Button type="button" size="lg" onClick={onConfirm} disabled={submitting}>
            Confirm &amp; Send {formatINR(paise)}
          </Button>
        </div>
      </div>
    </div>
  );
}
