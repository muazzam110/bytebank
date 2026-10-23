import { motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

// value = index of the step in progress. value === states.length means "all done".
export function MultiStepLoader({ loadingStates, value, className }) {
  return (
    <ol className={cn("space-y-3", className)}>
      {loadingStates.map((s, i) => {
        const done = i < value;
        const active = i === value;
        return (
          <motion.li
            key={s.text}
            initial={false}
            animate={{ opacity: i <= value ? 1 : 0.35 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 text-lg"
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                done ? "bg-success/20 text-success" : active ? "text-primary" : "text-slate-400"
              )}
            >
              {done ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <span className={done ? "text-foreground/80" : active ? "font-semibold text-foreground" : "text-muted-foreground"}>{s.text}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
