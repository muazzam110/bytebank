import { ArrowLeftRight, Gift, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { TYPE_LABELS } from "../transactionMeta";

const STYLE = {
  INITIAL_DEPOSIT: { icon: Gift, cls: "border-info/20 bg-info/10 text-info" },
  TRANSFER: { icon: ArrowLeftRight, cls: "border-primary/20 bg-primary/10 text-primary" },
  ADMIN_DEPOSIT: { icon: ShieldCheck, cls: "border-violet/20 bg-violet/10 text-violet" },
};

export default function TypeBadge({ type }) {
  const { icon: Icon, cls } = STYLE[type] ?? STYLE.TRANSFER;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cls)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {TYPE_LABELS[type] ?? type}
    </Badge>
  );
}
