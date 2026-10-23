import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CopyButton from "@/components/shared/CopyButton";
import Money from "@/components/shared/Money";
import { formatShortDateTime } from "@/lib/dates";
import { counterpartyLabel, moneyDirection } from "../transactionMeta";
import StatusBadge from "./StatusBadge";
import TypeBadge from "./TypeBadge";

function SortableHead({ field, sort, onSort, className, children }) {
  const asc = sort === field;
  const desc = sort === `-${field}`;
  const Icon = asc ? ArrowUp : desc ? ArrowDown : ArrowUpDown;
  return (
    <TableHead className={className} aria-sort={asc ? "ascending" : desc ? "descending" : "none"}>
      <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 rounded hover:text-foreground">
        {children}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  );
}

export default function TransactionsTable({ items, sort, onSort, onOpen }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead field="createdAt" sort={sort} onSort={onSort}>
              Date
            </SortableHead>
            <TableHead>Payment ID</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <SortableHead field="amount" sort={sort} onSort={onSort} className="text-right">
              Amount
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((tx) => (
            <TableRow key={tx.paymentId} onClick={() => onOpen(tx.paymentId)} className="cursor-pointer hover:bg-muted">
              <TableCell className="whitespace-nowrap">
                {/* the REAL keyboard/screen-reader target; clicking the row is just a mouse convenience */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(tx.paymentId);
                  }}
                  aria-label={`Open details for payment ${tx.paymentId}`}
                  className="rounded px-1 text-left text-foreground hover:underline"
                >
                  {formatShortDateTime(tx.createdAt)}
                </button>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 font-mono text-xs tracking-wide text-foreground/80">
                  {tx.paymentId}
                  <CopyButton value={tx.paymentId} label={`Copy payment ID ${tx.paymentId}`} className="h-8 w-8" />
                </span>
              </TableCell>
              <TableCell>
                <span className="block text-foreground">{counterpartyLabel(tx)}</span>
                {tx.counterparty?.maskedAccountNumber && (
                  <span className="block font-mono text-xs text-muted-foreground">{tx.counterparty.maskedAccountNumber}</span>
                )}
              </TableCell>
              <TableCell>
                <TypeBadge type={tx.type} />
              </TableCell>
              <TableCell>
                <StatusBadge status={tx.status} />
              </TableCell>
              <TableCell className="text-right">
                <Money paise={tx.amountPaise} direction={moneyDirection(tx)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
