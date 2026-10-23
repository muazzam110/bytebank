import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
const shortDate = (yyyyMmDd) => dayFmt.format(new Date(`${yyyyMmDd}T12:00:00+05:30`));

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-elev-2">
      <p className="text-muted-foreground">{p.label}</p>
      <p className="font-medium tabular-nums">{formatINR(p.balancePaise)}</p>
    </div>
  );
}

export default function TrajectoryChart({ range, onRangeChange, trajectory, loading, fetching }) {
  const reduced = useReducedEffects();
  const data = useMemo(() => (trajectory ?? []).map((p) => ({ ...p, label: shortDate(p.date) })), [trajectory]);
  const summaryText = data.length
    ? `Balance over the last ${data.length} days, from ${formatINR(data[0].balancePaise)} to ${formatINR(data.at(-1).balancePaise)}`
    : "No balance history yet";

  return (
    <Card className="h-full rounded-3xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold">Balance trajectory</CardTitle>
        <Tabs value={range} onValueChange={onRangeChange}>
          <TabsList className="rounded-full bg-muted p-1">
            {["7d", "30d", "90d"].map((r) => (
              <TabsTrigger key={r} value={r} className="rounded-full uppercase">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="skeleton h-[220px] w-full" />
        ) : (
          <div role="img" aria-label={summaryText} className={cn("h-[220px] transition-opacity", fetching && "opacity-60")}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="trajFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B3DF5" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#5B3DF5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E3E6F2" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5B6482", fontSize: 11 }} minTickGap={32} />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#A898FF", strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="balancePaise" stroke="#5B3DF5" strokeWidth={3} fill="url(#trajFill)" isAnimationActive={!reduced} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
