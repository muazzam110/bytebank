import { useDispatch, useSelector } from "react-redux";
import { useGetAccountQuery } from "@/api/accountApi";
import { formatINR, paiseToInputString } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAttemptKey, goToStep, setAmount, setDescription } from "../transferDraftSlice";
import { MAX_TRANSFER_PAISE, MIN_TRANSFER_PAISE, sanitizeAmountInput, validateAmount } from "../schemas/transferSchemas";
import StepHeading from "./StepHeading";

const QUICK_RUPEES = [100, 500, 1000];

export default function AmountStep() {
  const dispatch = useDispatch();
  const { recipient, amountInput, description } = useSelector((s) => s.transferDraft);
  const { data: account } = useGetAccountQuery();
  const available = account?.balancePaise; // from the SERVER; the server still re-checks on submit

  const { paise, error } = validateAmount(amountInput, available);
  const maxPaise = available === undefined ? 0 : Math.min(available, MAX_TRANSFER_PAISE);

  const onContinue = () => {
    dispatch(createAttemptKey()); // a NEW attempt gets a NEW idempotency key
    dispatch(goToStep(3));
  };

  return (
    <div className="space-y-6">
      <StepHeading>How much?</StepHeading>
      <p className="text-sm text-muted-foreground">
        To <strong className="text-foreground">{recipient?.name}</strong>{" "}
        <span className="font-mono text-xs">{recipient?.maskedAccountNumber}</span>{" "}
        <Button variant="link" className="h-auto p-0" onClick={() => dispatch(goToStep(1))}>
          Change
        </Button>
      </p>

      <div>
        <Label htmlFor="amount" className="sr-only">
          Amount in rupees
        </Label>
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-display text-display-figure text-muted-foreground" aria-hidden="true">
            ₹
          </span>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => dispatch(setAmount(sanitizeAmountInput(e.target.value)))}
            aria-invalid={!!error}
            aria-describedby="amount-help"
            className="w-full max-w-[280px] bg-transparent text-center font-display text-display-figure tabular-nums caret-primary outline-none placeholder:text-slate-400"
          />
        </div>
        {paise !== null && <p className="mt-1 text-center text-sm text-muted-foreground">{formatINR(paise)}</p>}
        <p id="amount-help" aria-live="polite" className={`mt-2 text-center text-sm ${error ? "text-danger" : "text-muted-foreground"}`}>
          {error ?? (available === undefined ? "Checking your balance…" : `Available ${formatINR(available)}`)}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_RUPEES.map((r) => (
          <Button key={r} type="button" variant="secondary" className="min-h-11" onClick={() => dispatch(setAmount(String(r)))}>
            {formatINR(r * 100).replace(".00", "")}
          </Button>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={maxPaise < MIN_TRANSFER_PAISE}
          onClick={() => dispatch(setAmount(paiseToInputString(maxPaise)))}
        >
          Max
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" maxLength={140} value={description} onChange={(e) => dispatch(setDescription(e.target.value))} placeholder="e.g. Lunch" />
        <p className="text-right text-xs text-muted-foreground">{description.length}/140</p>
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={() => dispatch(goToStep(1))}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={paise === null}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
