import Money from "@/components/shared/Money";
import { formatShortDateTime } from "@/lib/dates";
import { TYPE_LABELS, counterpartyLabel, moneyDirection } from "../transactionMeta";

export default function TransactionCard({ tx, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tx.paymentId)}
      aria-label={`Open details for payment ${tx.paymentId}`}
      className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{counterpartyLabel(tx)}</span>
        <span className="block text-xs text-muted-foreground">
          {formatShortDateTime(tx.createdAt)} · {TYPE_LABELS[tx.type]}
        </span>
      </span>
      <Money paise={tx.amountPaise} direction={moneyDirection(tx)} />
    </button>
  );
}
