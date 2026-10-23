import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SimulatedChip() {
  return (
    <Badge variant="outline" className="gap-1 border-gold/50 bg-gold-soft text-warning">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      <span className="hidden sm:inline">Simulated · No real money</span>
      <span className="sm:hidden">Simulated</span>
    </Badge>
  );
}
