import { Link } from "react-router-dom";
import { Send, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { avatarGradient, initials } from "@/lib/format";

// Summary items carry NAMES only (no account ids), so a chip opens the transfer page
// with the name pre-typed in the search box. You still pick the person explicitly.
export default function QuickSendCard({ transactions, loading }) {
  const names = [
    ...new Set(transactions.filter((t) => t.type === "TRANSFER" && t.counterparty?.name).map((t) => t.counterparty.name)),
  ].slice(0, 4);

  return (
    <Card className="h-full rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-primary">
            <Send className="h-4 w-4" aria-hidden="true" />
          </span>
          Quick send
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-4.5rem)] flex-col justify-between gap-5">
        {loading ? (
          <div className="skeleton h-14 w-full" />
        ) : names.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent people</p>
            <ul className="flex flex-wrap gap-3">
              {names.map((name) => (
                <li key={name}>
                  <Link
                    to={`/app/transfer?q=${encodeURIComponent(name)}`}
                    className="group flex w-16 flex-col items-center gap-1.5 text-center"
                  >
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-elev-1 transition-transform duration-200 group-hover:scale-110">
                      <AvatarFallback className="text-sm font-bold text-white" style={{ background: avatarGradient(name) }}>
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="w-full truncate text-xs font-medium">{name.split(" ")[0]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-5 text-center">
            <Users className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Send simulated money to anyone on Bytebank. Your recent people will show up here.</p>
          </div>
        )}
        <Button asChild className="w-full">
          <Link to="/app/transfer">Send money</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
