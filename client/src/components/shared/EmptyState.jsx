export default function EmptyState({ title, hint, action }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}
