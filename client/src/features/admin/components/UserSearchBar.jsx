import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

const ALL = "all"; // Radix Select items can't have an empty value

export default function UserSearchBar({ status, onChange }) {
  const [text, setText] = useState("");
  const debounced = useDebounce(text.trim(), 300);
  const lastQ = useRef("");

  useEffect(() => {
    if (debounced === lastQ.current) return;
    lastQ.current = debounced;
    onChange({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={40}
          placeholder="Search name or email…"
          aria-label="Search customers"
          className="pl-9"
        />
      </div>
      <Select value={status || ALL} onValueChange={(v) => onChange({ status: v === ALL ? "" : v })}>
        <SelectTrigger className="h-11 w-[160px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
