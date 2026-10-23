import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Money from "@/components/shared/Money";
import { cn } from "@/lib/cn";

export default function StatCard({ label, paise, direction, caption, loading }) {
  const credit = direction === "credit";
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;

  return (
    <Card className="relative h-full overflow-hidden rounded-3xl transition-all duration-300 ease-liquid hover:-translate-y-0.5 hover:shadow-elev-2">
      <div className={cn("absolute inset-x-0 top-0 h-1", credit ? "bg-success-gradient" : "bg-gradient-to-r from-warning-strong to-gold")} aria-hidden="true" />
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", credit ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-label uppercase text-muted-foreground">{label}</span>
        </div>
        {loading ? <div className="skeleton h-9 w-32" /> : <Money paise={paise} size="stat" className="text-foreground" />}
        <p className="text-xs font-medium text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}
