import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetTransactionQuery } from "@/api/transactionsApi";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/formErrors";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/shared/CopyButton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Money from "@/components/shared/Money";
import { counterpartyLabel, moneyDirection } from "../transactionMeta";
import StatusBadge from "./StatusBadge";
import TypeBadge from "./TypeBadge";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

export default function TransactionDetails({ paymentId }) {
  const balanceHidden = useSelector((s) => s.ui.balanceHidden);
  const { data: tx, isLoading, isError, error, refetch } = useGetTransactionQuery(paymentId);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="skeleton h-12 w-40" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    // "doesn't exist", "not yours" (both 404) and "malformed" (400) all show the SAME neutral message
    if ([400, 404].includes(error?.status)) {
      return <EmptyState title="No payment found" hint="Check the ID. You can only view payments you sent or received." />;
    }
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const received = tx.direction === "received";
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Money paise={tx.amountPaise} direction={moneyDirection(tx)} size="display" />
        <div className="flex flex-wrap gap-2">
          <TypeBadge type={tx.type} />
          <StatusBadge status={tx.status} />
        </div>
      </div>

      <dl className="divide-y divide-border rounded-2xl border border-border bg-muted px-4">
        <Row label="Payment ID">
          <span className="inline-flex items-center gap-1">
            <code className="font-mono text-xs tracking-wide">{tx.paymentId}</code>
            <CopyButton value={tx.paymentId} label="Copy payment ID" className="h-8 w-8" />
          </span>
        </Row>
        <Row label="Date & time">{formatDateTime(tx.createdAt)}</Row>
        <Row label={received ? "From" : "To"}>
          {counterpartyLabel(tx)}
          {tx.counterparty?.maskedAccountNumber && (
            <span className="block font-mono text-xs text-muted-foreground">{tx.counterparty.maskedAccountNumber}</span>
          )}
        </Row>
        {tx.description && <Row label="Note">{tx.description}</Row>}
        {tx.reason && <Row label="Reason">{tx.reason}</Row>}
        <Row label="Balance after">{balanceHidden ? "••••••" : formatINR(tx.balanceAfterPaise)}</Row>
      </dl>

      <Button asChild>
        <Link to={`/app/transactions/${tx.paymentId}/receipt`}>View receipt</Link>
      </Button>
    </div>
  );
}
