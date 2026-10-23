import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { differenceInCalendarDays } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRangeLabel, fromIsoDay, toIsoDay } from "@/lib/dates";
import { setFilter } from "../transactionsFilterSlice";

const MAX_SPAN_DAYS = 366;

export default function DateRangeFilter() {
  const dispatch = useDispatch();
  const { from, to } = useSelector((s) => s.transactionsFilter);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(undefined); // the in-progress pick; only APPLIED on the button

  const onOpenChange = (next) => {
    if (next) setDraft(from ? { from: fromIsoDay(from), to: to ? fromIsoDay(to) : undefined } : undefined);
    setOpen(next);
  };

  const tooLong = Boolean(draft?.from && draft?.to) && differenceInCalendarDays(draft.to, draft.from) > MAX_SPAN_DAYS;
  const canApply = Boolean(draft?.from) && !tooLong;

  const apply = () => {
    dispatch(setFilter({ from: toIsoDay(draft.from), to: toIsoDay(draft.to ?? draft.from) }));
    setOpen(false);
  };
  const clear = () => {
    dispatch(setFilter({ from: "", to: "" }));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="min-h-11 justify-start gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {from || to ? formatRangeLabel(from, to) : "Any date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          defaultMonth={draft?.from}
          numberOfMonths={1}
          disabled={{ after: new Date() }} // no future days: there are no future payments
        />
        <p role="status" className="min-h-5 px-1 text-xs text-danger">
          {tooLong ? `Pick a range of at most ${MAX_SPAN_DAYS} days.` : ""}
        </p>
        <div className="mt-2 flex justify-between gap-2">
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
          <Button onClick={apply} disabled={!canApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
