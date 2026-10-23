import { ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGoBack } from "@/hooks/useGoBack";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TransactionDetails from "../components/TransactionDetails";

export default function TransactionDetailPage() {
  const { paymentId } = useParams();
  const goBack = useGoBack("/app/transactions");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <h1 className="font-display text-3xl font-bold tracking-tight">Payment details</h1>
      </div>
      <Card className="rounded-3xl shadow-elev-2">
        <CardContent className="p-6 sm:p-8">
          <TransactionDetails paymentId={paymentId.toUpperCase()} />
        </CardContent>
      </Card>
    </div>
  );
}
