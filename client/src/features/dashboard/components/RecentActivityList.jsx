import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import Money from "@/components/shared/Money";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

function timeAgo(iso) {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000; // negative = in the past
  if (Math.abs(diffSec) >= 7 * 86400) return dateFmt.format(new Date(iso));
  for (const [unit, secs] of [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]) {
    if (Math.abs(diffSec) >= secs) return rtf.format(Math.round(diffSec / secs), unit);
  }
  return "just now";
}

function ActivityIcon({ tx }) {
  const welcome = tx.type === "INITIAL_DEPOSIT";
  const received = tx.direction === "received";
  const Icon = welcome ? Gift : received ? ArrowDownLeft : ArrowUpRight;
  const tint = welcome ? "bg-info-soft text-info" : received ? "bg-success-soft text-success" : "bg-warning-soft text-warning";
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint}`} aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function titleFor(tx) {
  if (tx.type === "INITIAL_DEPOSIT") return "Welcome deposit";
  if (tx.type === "ADMIN_DEPOSIT") return "Deposit from Bytebank";
  const who = tx.counterparty?.name ?? "Unknown";
  return tx.direction === "received" ? `From ${who}` : `To ${who}`;
}

export default function RecentActivityList({ transactions, loading }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold">Recent activity</CardTitle>
        <Link to="/app/transactions" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState title="No activity yet" hint="Your transactions will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => (
              <li key={tx.paymentId} className="py-1">
                <Link
                  to={`/app/transactions/${tx.paymentId}`}
                  className="flex items-center gap-4 rounded-2xl px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <ActivityIcon tx={tx} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{titleFor(tx)}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono tracking-wide">{tx.paymentId}</span> · {timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <Money paise={tx.amountPaise} direction={tx.direction === "received" ? "credit" : "debit"} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
