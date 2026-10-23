import { Check, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { STATUS_LABELS } from "../transactionMeta";

const STYLE = {
  COMPLETED: { icon: Check, cls: "border-success/20 bg-success/10 text-success" },
  PENDING: { icon: Clock, cls: "border-warning/20 bg-warning/10 text-warning" },
  FAILED: { icon: X, cls: "border-danger/20 bg-danger/10 text-danger" },
};

export default function StatusBadge({ status }) {
  const { icon: Icon, cls } = STYLE[status] ?? STYLE.COMPLETED;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cls)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
