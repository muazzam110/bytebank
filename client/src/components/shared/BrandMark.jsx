import { cn } from "@/lib/cn";

// The Bytebank logo: a gradient tile with a stylised "B" + wordmark.
// `light` = used on top of the dark gradient panels (white text, glassy tile).
export default function BrandMark({ className, light = false, showText = true }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          light ? "bg-white/20 ring-1 ring-white/30" : "bg-brand-gradient shadow-glow-brand"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 4v16" />
          <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7" />
          <path d="M7 12h7a4 4 0 0 1 0 8H7" />
        </svg>
      </span>
      {showText && (
        <span className={cn("font-display text-lg font-bold tracking-tight", light ? "text-white" : "text-foreground")}>Bytebank</span>
      )}
    </span>
  );
}
