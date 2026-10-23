import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["Recipient", "Amount", "Review", "Result"];

export default function TransferStepper({ current }) {
  return (
    <ol aria-label="Transfer progress" className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                done ? "bg-success/20 text-success" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
            </span>
            <span className={cn("sr-only sm:not-sr-only text-xs", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {n < STEPS.length && <span className="h-px flex-1 bg-primary/10" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
