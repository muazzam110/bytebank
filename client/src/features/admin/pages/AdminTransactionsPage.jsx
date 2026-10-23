import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { useGetAdminTransactionsQuery } from "@/api/adminApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatShortDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/formErrors";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CopyButton from "@/components/shared/CopyButton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Money from "@/components/shared/Money";
import { STATUSES, TYPES } from "@/features/transactions/filterConfig";
import { STATUS_LABELS, TYPE_LABELS } from "@/features/transactions/transactionMeta";
import PaginationBar from "@/features/transactions/components/PaginationBar";
import StatusBadge from "@/features/transactions/components/StatusBadge";
import TypeBadge from "@/features/transactions/components/TypeBadge";

const OBJECT_ID = /^[a-f\d]{24}$/i;
const ALL = "all";
const SORT_OPTIONS = [
  ["-createdAt", "Newest first"],
  ["createdAt", "Oldest first"],
  ["-amount", "Highest amount"],
  ["amount", "Lowest amount"],
];
const DAY_MS = 24 * 60 * 60 * 1000;

export default function AdminTransactionsPage() {
  const [params, setParams] = useSearchParams();
  const rawUser = params.get("userId") ?? "";
  const userId = OBJECT_ID.test(rawUser) ? rawUser : ""; // from "View all transactions" on a user's page

  const [f, setF] = useState({ q: "", type: "", status: "", from: "", to: "", sort: "-createdAt", page: 1, limit: 20 });
  const [text, setText] = useState("");
  const debounced = useDebounce(text.trim(), 300);
  useEffect(() => {
    setF((prev) => (prev.q === debounced ? prev : { ...prev, q: debounced, page: 1 }));
  }, [debounced]);
  const update = (patch) => setF((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  // never send an invalid range (the server would answer 400); tell the admin instead
  const rangeError =
    f.from && f.to && f.from > f.to
      ? "'From' must not be after 'To'."
      : f.from && f.to && (Date.parse(f.to) - Date.parse(f.from)) / DAY_MS > 366
        ? "Pick a range of at most 366 days."
        : "";
  const query = { ...f, userId, from: rangeError ? "" : f.from, to: rangeError ? "" : f.to };
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminTransactionsQuery(query, { refetchOnMountOrArgChange: 30 });
  const today = new Date().toISOString().slice(0, 10);

  const clearUser = () => {
    const next = new URLSearchParams(params);
    next.delete("userId");
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">All transactions</h1>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={40}
          placeholder="Search payment ID or name…"
          aria-label="Search by payment ID or name"
        />
        <div className="flex flex-wrap items-end gap-3">
          <Select value={f.type || ALL} onValueChange={(v) => update({ type: v === ALL ? "" : v })}>
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
          <Select value={f.status || ALL} onValueChange={(v) => update({ status: v === ALL ? "" : v })}>
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
          <Select value={f.sort} onValueChange={(v) => update({ sort: v })}>
            <SelectTrigger className="h-11 w-[170px]" aria-label="Sort order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="space-y-1 text-xs text-muted-foreground">
            From
            <Input type="date" max={today} value={f.from} onChange={(e) => update({ from: e.target.value })} className="h-11 w-[160px]" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            To
            <Input type="date" max={today} value={f.to} onChange={(e) => update({ to: e.target.value })} className="h-11 w-[160px]" />
          </label>
        </div>
        {rangeError && (
          <p role="alert" className="text-xs text-danger">
            {rangeError}
          </p>
        )}
        {userId && (
          <button
            type="button"
            onClick={clearUser}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-xs text-foreground hover:bg-accent"
          >
            Showing one customer's payments <X className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Remove customer filter</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : isError && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No transactions match"
          hint="Try removing a filter."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setText("");
                setF((p) => ({ ...p, q: "", type: "", status: "", from: "", to: "", page: 1 }));
                if (userId) clearUser();
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div aria-busy={isFetching} className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((tx) => (
                  <TableRow key={tx.paymentId} className="hover:bg-muted">
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatShortDateTime(tx.createdAt)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-xs tracking-wide text-foreground/80">
                        {tx.paymentId}
                        <CopyButton value={tx.paymentId} label={`Copy payment ID ${tx.paymentId}`} className="h-8 w-8" />
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{tx.sender?.name ?? "Bytebank"}</TableCell>
                    <TableCell className="text-foreground">{tx.recipient.name}</TableCell>
                    <TableCell>
                      <TypeBadge type={tx.type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={tx.amountPaise} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar meta={data.meta} onPage={(page) => update({ page })} onLimit={(limit) => update({ limit })} />
        </div>
      )}
    </div>
  );
}
