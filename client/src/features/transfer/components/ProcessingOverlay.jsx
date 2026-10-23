import { useEffect, useRef, useState } from "react";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { MultiStepLoader } from "@/components/aceternity/multi-step-loader";

export const TRANSFER_STEPS = [
  { text: "Verifying your account" },
  { text: "Checking available balance" },
  { text: "Moving funds securely" },
  { text: "Recording in the ledger" },
  { text: "Preparing your receipt" }, // ← ONLY reachable once the server has answered
];
const STEP_MS = 420; // narration pace while we wait
const FAST_MS = 120; // fast-forward once the answer is in
const MIN_TOTAL_MS = 1200; // so it never just flashes by

export default function ProcessingOverlay({ settled, onDone, title = "Sending your payment", steps = TRANSFER_STEPS }) {
  const reduced = useReducedEffects();
  const [current, setCurrent] = useState(0);
  const startedAt = useRef(Date.now());
  const rootRef = useRef(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const last = steps.length - 1;
  const finished = settled && current >= last;

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  // Advance one step at a time. Until the server answers we STOP one step before the last.
  useEffect(() => {
    const cap = settled ? last : last - 1;
    if (current >= cap) return;
    const t = setTimeout(() => setCurrent((c) => Math.min(c + 1, cap)), settled ? FAST_MS : STEP_MS);
    return () => clearTimeout(t);
  }, [current, settled, last]);

  useEffect(() => {
    if (!finished) return;
    const wait = Math.max(0, MIN_TOTAL_MS - (Date.now() - startedAt.current)) + 350;
    const t = setTimeout(() => onDoneRef.current?.(), wait);
    return () => clearTimeout(t);
  }, [finished]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="glass-strong fixed inset-0 z-50 flex items-center justify-center p-6 outline-none"
    >
      <div className="w-full max-w-sm space-y-6">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="sr-only" aria-live="polite">
          {finished ? "Complete" : steps[current].text}
        </p>

        {reduced ? (
          // Reduced effects: plain text + a simple bar, no animation
          <div>
            <p className="text-sm text-foreground/80">
              Step {Math.min(current + 1, steps.length)} of {steps.length}: {steps[current].text}
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-accent">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${((finished ? steps.length : current + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <MultiStepLoader loadingStates={steps} value={finished ? steps.length : current} />
        )}
        <p className="text-xs text-muted-foreground">Please keep this page open.</p>
      </div>
    </div>
  );
}
