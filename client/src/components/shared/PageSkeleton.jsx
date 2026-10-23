export default function PageSkeleton() {
  return (
    <div className="container py-16 space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-24 w-2/3" />
    </div>
  );
}
