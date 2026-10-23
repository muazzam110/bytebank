import { amountInWords } from "@/lib/amountInWords";
import { formatINR, rupeesStringToPaise } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

// `review` = { customer, amount (string), reason } or null when closed
export default function DepositReviewDialog({ review, onCancel, onConfirm }) {
  const paise = review ? rupeesStringToPaise(review.amount) : null;
  return (
    <Dialog
      open={Boolean(review)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="glass-strong rounded-3xl">
        <DialogHeader>
          <DialogTitle>Review deposit</DialogTitle>
          <DialogDescription>This creates new simulated money. Check every detail before you confirm.</DialogDescription>
        </DialogHeader>
        {review && paise !== null && (
          <>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-muted px-4">
              <Row label="Customer">
                {review.customer.name}
                <span className="block text-xs text-muted-foreground">{review.customer.email}</span>
              </Row>
              <Row label="Amount">
                {formatINR(paise)}
                <span className="block text-xs text-muted-foreground">{amountInWords(paise)}</span>
              </Row>
              <Row label="Reason">{review.reason}</Row>
            </dl>
            <p role="note" className="text-xs text-muted-foreground">
              The customer sees this reason in their transaction details. Every deposit is recorded in the audit log under your name.
            </p>
          </>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Back
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
