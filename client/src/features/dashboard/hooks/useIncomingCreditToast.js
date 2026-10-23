import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatINR } from "@/lib/money";

// Toasts when a NEW received payment shows up in the polled summary.
// Everything comes from server data; the client computes nothing.
export function useIncomingCreditToast(transactions) {
  const seen = useRef(null);
  useEffect(() => {
    if (!transactions) return;
    if (seen.current === null) {
      // first data: just remember what exists
      seen.current = new Set(transactions.map((t) => t.paymentId));
      return;
    }
    for (const t of transactions) {
      if (seen.current.has(t.paymentId)) continue;
      seen.current.add(t.paymentId);
      if (t.direction === "received") {
        toast.success(`${formatINR(t.amountPaise)} received${t.counterparty?.name ? ` from ${t.counterparty.name}` : ""}`);
      }
    }
  }, [transactions]);
}
