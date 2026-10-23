import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRangeLabel } from "@/lib/dates";
import { resetFilters, setFilter } from "../transactionsFilterSlice";
import { STATUS_LABELS, TYPE_LABELS } from "../transactionMeta";

export default function ActiveFilterChips() {
  const dispatch = useDispatch();
  const f = useSelector((s) => s.transactionsFilter);

  const chips = [];
  if (f.q) chips.push({ key: "q", label: `Search: ${f.q}`, clear: { q: "" } });
  if (f.direction !== "all")
    chips.push({ key: "direction", label: `Direction: ${f.direction === "sent" ? "Sent" : "Received"}`, clear: { direction: "all" } });
  if (f.type) chips.push({ key: "type", label: `Type: ${TYPE_LABELS[f.type]}`, clear: { type: "" } });
  if (f.status) chips.push({ key: "status", label: `Status: ${STATUS_LABELS[f.status]}`, clear: { status: "" } });
  if (f.from || f.to) chips.push({ key: "date", label: `Dates: ${formatRangeLabel(f.from, f.to)}`, clear: { from: "", to: "" } });
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => dispatch(setFilter(chip.clear))}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-xs text-foreground hover:bg-accent"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={() => dispatch(resetFilters())}>
        Clear all
      </Button>
    </div>
  );
}
