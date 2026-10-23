import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandMark from "@/components/shared/BrandMark";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
];

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" aria-label="Bytebank home">
            <BrandMark />
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Open free account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 text-sm text-muted-foreground sm:flex-row">
          <BrandMark />
          <p className="max-w-xl text-center sm:text-right">
            Bytebank is an educational project. All money is simulated: no real payments, no real accounts, no real funds.
          </p>
        </div>
      </footer>
    </div>
  );
}
