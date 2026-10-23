import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { useGetSummaryQuery } from "@/api/accountApi";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { getErrorMessage } from "@/lib/formErrors";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { TYPE_LABELS } from "../transactionMeta";

const TYPE_COLORS = { INITIAL_DEPOSIT: "#38E1F5", TRANSFER: "#4F7CFF", ADMIN_DEPOSIT: "#A78BFA" };
const TOOLTIP = {
  contentStyle: { background: "#151925", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 },
  labelStyle: { color: "#D4D4D8" },
  itemStyle: { color: "#FAFAFA" },
};

export default function AnalyticsCore() {
  const reduced = useReducedEffects();
  const [open, setOpen] = useState(false);
  const [asTable, setAsTable] = useState(false);
  // `skip` → no request until the panel is opened (and a cache hit if the dashboard already loaded it)
  const { data, isLoading, isError, error, refetch } = useGetSummaryQuery("30d", { skip: !open });

  const bars = data
    ? [
        { name: "Received", value: data.totalReceivedPaise, color: "#2EE6A6" },
        { name: "Sent", value: data.totalSentPaise, color: "#FFB84D" },
      ]
    : [];
  const slices = data
    ? Object.entries(data.byType).map(([type, value]) => ({
        name: TYPE_LABELS[type] ?? type,
        value,
        color: TYPE_COLORS[type] ?? "#71717A",
      }))
    : [];

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-xl font-semibold">Analytics · last 30 days</CardTitle>
        <Button variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Hide" : "Show"}
          <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </Button>
      </CardHeader>

      {open && (
        <CardContent>
          {isLoading ? (
            <div className="skeleton h-[200px] w-full" aria-busy="true" />
          ) : isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          ) : data.transactionCount === 0 ? (
            <EmptyState title="No activity in the last 30 days" />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                  {asTable ? "View as charts" : "View as table"}
                </Button>
              </div>

              {asTable ? (
                <table className="w-full text-sm">
                  <caption className="sr-only">Money received and sent, and value by payment type, last 30 days</caption>
                  <tbody className="divide-y divide-border">
                    {[...bars, ...slices].map((row) => (
                      <tr key={row.name}>
                        <th scope="row" className="py-2 text-left font-normal text-muted-foreground">
                          {row.name}
                        </th>
                        <td className="py-2 text-right tabular-nums text-foreground">{formatINR(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div
                    role="img"
                    aria-label={`Received ${formatINR(data.totalReceivedPaise)}, sent ${formatINR(data.totalSentPaise)}`}
                    className="h-[200px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bars} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#A1A1AA", fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip {...TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => formatINR(v)} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={!reduced}>
                          {bars.map((b) => (
                            <Cell key={b.name} fill={b.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    role="img"
                    aria-label={`Value by type: ${slices.map((s) => `${s.name} ${formatINR(s.value)}`).join(", ")}`}
                    className="h-[200px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip {...TOOLTIP} formatter={(v, name) => [formatINR(v), name]} />
                        <Pie
                          data={slices}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="85%"
                          paddingAngle={2}
                          stroke="none"
                          isAnimationActive={!reduced}
                        >
                          {slices.map((s) => (
                            <Cell key={s.name} fill={s.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
