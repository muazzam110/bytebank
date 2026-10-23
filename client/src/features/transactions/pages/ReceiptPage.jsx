import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGetReceiptQuery } from "@/api/transactionsApi";
import { useGoBack } from "@/hooks/useGoBack";
import { getErrorMessage } from "@/lib/formErrors";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import ReceiptView from "../components/ReceiptView";

export default function ReceiptPage() {
  const { paymentId: raw } = useParams();
  const paymentId = raw.toUpperCase();
  const goBack = useGoBack(`/app/transactions/${paymentId}`);
  const { data: receipt, isLoading, isError, error, refetch } = useGetReceiptQuery(paymentId);

  // "Save as PDF" uses the page title as the default file name
  useEffect(() => {
    const previous = document.title;
    document.title = `Bytebank receipt ${paymentId}`;
    return () => {
      document.title = previous;
    };
  }, [paymentId]);

  let body;
  if (isLoading) body = <div className="skeleton mx-auto h-96 max-w-xl" aria-busy="true" />;
  else if (isError && [400, 404].includes(error?.status)) {
    body = <EmptyState title="No payment found" hint="Check the ID. You can only view receipts for payments you sent or received." />;
  } else if (isError) body = <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  else body = <ReceiptView receipt={receipt} />;

  return (
    <div className="space-y-6">
      {/* print:hidden → the buttons don't appear on the paper */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <Button onClick={() => window.print()} disabled={!receipt}>
          <Printer className="mr-1 h-4 w-4" aria-hidden="true" />
          Print / Save as PDF
        </Button>
      </div>
      {body}
    </div>
  );
}
