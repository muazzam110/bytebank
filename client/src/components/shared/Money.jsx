import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { splitINR } from "@/lib/money";
import { cn } from "@/lib/cn";

// Size tokens come from tailwind.config.js (fontSize)
const SIZE = {
  hero: "font-display text-hero-figure",
  display: "font-display text-display-figure",
  stat: "text-stat-figure",
  row: "text-row-figure",
};

// Colour comes from `currentColor`, so it works on white cards AND on the gradient hero (pass className="text-white").
export default function Money({ paise, direction, size = "row", className }) {
  const { symbol, whole, fraction } = splitINR(paise);
  const credit = direction === "credit";
  const debit = direction === "debit";
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
  const spoken = `${credit ? "Received " : debit ? "Sent " : ""}${whole} rupees and ${fraction} paise`;

  return (
    <span
      role="img"
      aria-label={spoken}
      className={cn("inline-flex items-baseline tabular-nums", SIZE[size], credit && "text-credit", debit && "text-debit", className)}
    >
      {/* direction is shown by icon AND sign, never by colour alone */}
      {direction && <Icon className="mr-1 h-[0.7em] w-[0.7em] self-center" aria-hidden="true" />}
      <span aria-hidden="true">
        {credit && "+"}
        {debit && "−"}
        <span className="mr-0.5 text-[0.6em] opacity-80">{symbol}</span>
        {whole}
        <span className="text-[0.6em] opacity-80">.{fraction}</span>
      </span>
    </span>
  );
}
