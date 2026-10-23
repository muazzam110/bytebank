import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export { Skeleton };
