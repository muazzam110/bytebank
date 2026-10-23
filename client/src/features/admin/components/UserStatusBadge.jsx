import { Ban, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export default function UserStatusBadge({ status }) {
  const active = status === "ACTIVE";
  const Icon = active ? Check : Ban;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", active ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger")}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {active ? "Active" : "Suspended"}
    </Badge>
  );
}
