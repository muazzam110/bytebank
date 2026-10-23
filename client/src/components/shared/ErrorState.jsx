import { Button } from "@/components/ui/button";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/40 bg-card p-8 text-center space-y-3">
      <p className="text-sm text-foreground/80">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
