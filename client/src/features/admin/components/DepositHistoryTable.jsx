import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CopyButton from "@/components/shared/CopyButton";
import EmptyState from "@/components/shared/EmptyState";
import Money from "@/components/shared/Money";
import { formatDateTime } from "@/lib/dates";

export default function DepositHistoryTable({ items, loading, hideCustomer = false }) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return <EmptyState title="No deposits yet" hint="Deposits made by admins will be listed here." />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            {!hideCustomer && <TableHead>Customer</TableHead>}
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Payment ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.paymentId} className="hover:bg-muted">
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</TableCell>
              {!hideCustomer && (
                <TableCell>
                  <Link to={`/admin/users/${d.customer.id}`} className="text-foreground hover:underline">
                    {d.customer.name}
                  </Link>
                </TableCell>
              )}
              <TableCell className="text-right">
                <Money paise={d.amountPaise} direction="credit" />
              </TableCell>
              <TableCell className="max-w-[260px] truncate text-foreground/80" title={d.reason ?? ""}>
                {d.reason ?? "—"}
              </TableCell>
              <TableCell className="text-foreground/80">{d.admin.name}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 font-mono text-xs tracking-wide text-foreground/80">
                  {d.paymentId}
                  <CopyButton value={d.paymentId} label={`Copy payment ID ${d.paymentId}`} className="h-8 w-8" />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
