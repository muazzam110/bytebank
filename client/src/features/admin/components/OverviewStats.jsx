import { Activity, Banknote, UserCheck, UserX, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Money from "@/components/shared/Money";

const count = new Intl.NumberFormat("en-IN");

export default function OverviewStats({ data, loading }) {
  const n = (v) => <span className="text-stat-figure tabular-nums">{count.format(v)}</span>;
  const cards = [
    { label: "Customers", icon: Users, tint: "bg-brand-50 text-primary", value: data && n(data.customers) },
    { label: "Active", icon: UserCheck, tint: "bg-success-soft text-success", value: data && n(data.active) },
    { label: "Suspended", icon: UserX, tint: "bg-danger-soft text-danger", value: data && n(data.suspended) },
    {
      label: "Total simulated balance",
      icon: Wallet,
      tint: "bg-violet-soft text-violet",
      value: data && <Money paise={data.totalBalancePaise} size="stat" className="text-foreground" />,
    },
    { label: "Transactions (24 h)", icon: Activity, tint: "bg-info-soft text-info", value: data && n(data.transactions24h) },
    {
      label: "Total admin deposits",
      icon: Banknote,
      tint: "bg-gold-soft text-warning",
      value: data && <Money paise={data.totalAdminDepositsPaise} size="stat" className="text-foreground" />,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ label, icon: Icon, tint, value }) => (
        <Card key={label} className="rounded-3xl transition-all duration-300 ease-liquid hover:-translate-y-0.5 hover:shadow-elev-2">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-label uppercase text-muted-foreground">{label}</p>
            </div>
            {loading || !data ? <div className="skeleton h-9 w-28" /> : value}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
