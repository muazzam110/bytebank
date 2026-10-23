import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { STATUSES, TYPES } from "../filterConfig";
import { STATUS_LABELS, TYPE_LABELS } from "../transactionMeta";
import { setFilter } from "../transactionsFilterSlice";
import DateRangeFilter from "./DateRangeFilter";

const ALL = "all"; // Radix <Select.Item> may NOT have an empty-string value, so "no filter" is the word "all"
const DIRECTIONS = [
  ["all", "All"],
  ["sent", "Sent"],
  ["received", "Received"],
];

export default function FilterBar() {
  const dispatch = useDispatch();
  const f = useSelector((s) => s.transactionsFilter);

  // ── search box: local text, committed to Redux 300 ms after you STOP typing ──
  const [text, setText] = useState(f.q);
  const debounced = useDebounce(text.trim(), 300);
  const lastSent = useRef(f.q); // the last q WE put into the slice, so we can tell "my own echo" from "changed elsewhere"

  useEffect(() => {
    if (debounced === f.q) return;
    lastSent.current = debounced;
    dispatch(setFilter({ q: debounced }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // q changed from outside (Back button, chip ✕, "Clear all") → update the box
  useEffect(() => {
    if (f.q !== lastSent.current) {
      lastSent.current = f.q;
      setText(f.q);
    }
  }, [f.q]);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={40}
          placeholder="Search payment ID or name…"
          aria-label="Search by payment ID or name"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Direction" className="inline-flex rounded-full bg-muted p-1">
          {DIRECTIONS.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={f.direction === value}
              onClick={() => dispatch(setFilter({ direction: value }))}
              className={`min-h-9 rounded-full ${f.direction === value ? "bg-card font-bold text-primary shadow-elev-1" : "text-muted-foreground"}`}
            >
              {label}
            </Button>
          ))}
        </div>

        <Select value={f.type || ALL} onValueChange={(v) => dispatch(setFilter({ type: v === ALL ? "" : v }))}>
          <SelectTrigger className="h-11 w-[170px]" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={f.status || ALL} onValueChange={(v) => dispatch(setFilter({ status: v === ALL ? "" : v }))}>
          <SelectTrigger className="h-11 w-[150px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangeFilter />
      </div>
    </div>
  );
}
