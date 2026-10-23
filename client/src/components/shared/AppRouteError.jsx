import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AppRouteError() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <section role="alert" className="w-full max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl font-bold">This page couldn&apos;t load</h1>
        <p className="text-sm text-muted-foreground">
          Check your connection and try again. Your account and transactions are unchanged.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button asChild variant="secondary">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}