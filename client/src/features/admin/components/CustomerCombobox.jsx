import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useGetAdminUsersQuery } from "@/api/adminApi";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function CustomerCombobox({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const debounced = useDebounce(text.trim(), 300);
  // only ACTIVE customers can receive deposits; `skip` → no request until the list is opened
  const { data, isFetching } = useGetAdminUsersQuery({ q: debounced, status: "ACTIVE", page: 1, limit: 8 }, { skip: !open });
  const items = data?.items ?? [];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="customer">Customer</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="customer"
            type="button"
            variant="secondary"
            role="combobox"
            aria-expanded={open}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "customer-error" : undefined}
            className="h-11 w-full justify-between"
          >
            <span className="truncate">{value ? `${value.name} · ${value.email}` : "Choose a customer…"}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          {/* the SERVER filters (search is debounced), so cmdk's own filtering is off */}
          <Command shouldFilter={false}>
            <CommandInput value={text} onValueChange={setText} placeholder="Search name or email…" />
            <CommandList>
              <CommandEmpty>{isFetching ? "Searching…" : "No active customers found."}</CommandEmpty>
              <CommandGroup>
                {items.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={u.id}
                    onSelect={() => {
                      onChange(u);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{u.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p id="customer-error" role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
