import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default function CopyButton({ value, label = "Copy", className }) {
  const copy = async (e) => {
    e.stopPropagation(); // inside a clickable table row, copying must NOT also open the row
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  return (
    <Button type="button" variant="ghost" size="icon" className={cn("h-10 w-10", className)} onClick={copy} aria-label={label}>
      <Copy className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
