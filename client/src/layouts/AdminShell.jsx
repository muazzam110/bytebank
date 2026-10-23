import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeftRight, Banknote, Gauge, ShieldCheck, Users } from "lucide-react";
import { selectUser } from "@/features/auth/authSlice";
import LogoutButton from "@/features/auth/components/LogoutButton";
import BrandMark from "@/components/shared/BrandMark";
import SimulatedChip from "@/components/shared/SimulatedChip";
import SkipLink from "@/components/shared/SkipLink";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/admin/overview", label: "Overview", icon: Gauge },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/admin/deposits", label: "Deposits", icon: Banknote },
];

const linkClass = ({ isActive }) =>
  cn(
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
    isActive ? "bg-violet text-white shadow-elev-2" : "text-muted-foreground hover:bg-violet-soft hover:text-violet"
  );

export default function AdminShell() {
  const user = useSelector(selectUser);
  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="h-1 bg-gradient-to-r from-violet via-brand-600 to-gold" /> {/* admin accent strip */}
        <div className="flex h-16 items-center gap-2 px-5">
          <BrandMark />
        </div>
        <p className="px-5 pb-2 text-label uppercase text-violet">Admin console</p>
        <nav aria-label="Admin" className="flex-1 space-y-1.5 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-2xl bg-violet-soft p-4 text-violet">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold">Privileged area</p>
          <p className="mt-1 text-xs leading-relaxed">Every deposit and suspension is recorded in the audit log.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 border-b border-border">
          <div className="h-1 bg-gradient-to-r from-violet via-brand-600 to-gold lg:hidden" />
          <div className="flex h-16 items-center justify-between px-6">
            <span className="lg:hidden">
              <BrandMark />
            </span>
            <div className="ml-auto flex items-center gap-3">
              <SimulatedChip />
              <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
              <Badge variant="outline" className="border-violet/30 bg-violet-soft text-violet">
                Admin
              </Badge>
              <LogoutButton />
            </div>
          </div>
          {/* mobile navigation: a scrollable row under the header */}
          <nav aria-label="Admin (mobile)" className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1 lg:hidden">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={(s) => cn(linkClass(s), "shrink-0")}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 p-6 outline-none lg:p-10">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
