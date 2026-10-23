import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import TransactionDetails from "./TransactionDetails";

// Radix wants BOTH a title and a description (screen readers announce them); omitting them logs a warning
export default function TransactionSheet({ paymentId, onClose }) {
  return (
    <Sheet
      open={Boolean(paymentId)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="glass-strong w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Payment details</SheetTitle>
          <SheetDescription>Everything about this payment, straight from the server.</SheetDescription>
        </SheetHeader>
        <div className="mt-6">{paymentId && <TransactionDetails paymentId={paymentId} />}</div>
      </SheetContent>
    </Sheet>
  );
}
