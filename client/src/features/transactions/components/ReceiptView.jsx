import { amountInWords } from "@/lib/amountInWords";
import { formatDateTime } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { STATUS_LABELS, TYPE_LABELS } from "../transactionMeta";

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-6 border-b border-zinc-200 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

function Party({ party, fallback }) {
  if (!party) return fallback;
  return (
    <>
      {party.name}
      {party.maskedAccountNumber && (
        <span className="block font-mono text-xs font-normal text-muted-foreground">A/C {party.maskedAccountNumber}</span>
      )}
    </>
  );
}

export default function ReceiptView({ receipt }) {
  return (
    <article
      aria-label="Payment receipt"
      className="receipt-paper relative mx-auto max-w-xl overflow-hidden rounded-2xl bg-white p-8 text-foreground shadow-elev-3"
    >
      {/* the "Simulated" watermark: decorative, so hidden from screen readers (the footer says it in words) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="-rotate-[24deg] select-none text-6xl font-bold tracking-[0.3em] text-foreground/[0.06]">SIMULATED</span>
      </div>

      <div className="relative space-y-6">
        <header className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
          <div>
            <p className="font-display text-xl font-semibold">◆ Bytebank</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Payment receipt</p>
          </div>
          <p className="text-right text-xs text-muted-foreground">{formatDateTime(receipt.createdAt)}</p>
        </header>

        <div className="space-y-1 text-center">
          <p className="font-display text-4xl font-semibold tabular-nums">{formatINR(receipt.amountPaise)}</p>
          <p className="text-sm text-slate-400">{amountInWords(receipt.amountPaise)}</p>
        </div>

        <dl>
          <Row label="Payment ID">
            <span className="font-mono text-xs tracking-wide">{receipt.paymentId}</span>
          </Row>
          <Row label="Type">{TYPE_LABELS[receipt.type] ?? receipt.type}</Row>
          <Row label="Status">{STATUS_LABELS[receipt.status] ?? receipt.status}</Row>
          <Row label="From">
            <Party party={receipt.sender} fallback="Bytebank (simulated deposit)" />
          </Row>
          <Row label="To">
            <Party party={receipt.recipient} fallback="—" />
          </Row>
          {receipt.description && <Row label="Note">{receipt.description}</Row>}
        </dl>

        <footer className="border-t border-zinc-200 pt-4 text-center text-xs text-muted-foreground">
          Simulated transaction. Not a real payment. No real money was moved.
        </footer>
      </div>
    </article>
  );
}
