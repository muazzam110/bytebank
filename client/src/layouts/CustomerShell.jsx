import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeftRight, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Search, Send, User } from "lucide-react";
import { selectUser } from "@/features/auth/authSlice";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { setReduceEffects, toggleSidebar } from "@/features/ui/uiSlice";
import BrandMark from "@/components/shared/BrandMark";
import SimulatedChip from "@/components/shared/SimulatedChip";
import SkipLink from "@/components/shared/SkipLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { avatarGradient, initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/transfer", label: "Send money", icon: Send },
  { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/app/lookup", label: "Payment lookup", icon: Search },
  { to: "/app/profile", label: "Profile & security", icon: User },
];

function NavItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={({ isActive }) =>
        cn(
          "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-brand-gradient text-white shadow-glow-brand"
            : "text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && item.label}
    </NavLink>
  );
}

// Mobile bottom dock: Home · Transactions · SEND (raised) · Lookup · Profile
const DOCK = [NAV[0], NAV[2], NAV[1], NAV[3], NAV[4]];

function MobileDock() {
  return (
    <nav
      aria-label="Main (mobile)"
      className="fixed inset-x-0 bottom-0 z-20 flex items-end justify-around border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl print:!hidden lg:hidden"
    >
      {DOCK.map((item, i) => {
        const Icon = item.icon;
        const center = i === 2;
        const short = item.label.split(" ")[0];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
                center ? "-mt-6 h-16 w-16 rounded-full bg-brand-gradient text-white shadow-glow-brand" : "h-14 w-14 text-muted-foreground",
                isActive && !center && "text-primary"
              )
            }
          >
            <Icon className={center ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
            {!center && short}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function CustomerShell() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const reduceEffects = useSelector((s) => s.ui.reduceEffects);
  const { logout } = useLogout();

  return (
    <div className="flex min-h-screen">
      <SkipLink />
      {/* Sidebar (desktop) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen flex-col border-r border-border bg-card transition-[width] duration-300 ease-liquid print:!hidden lg:flex",
          collapsed ? "w-[84px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center px-5">
          <BrandMark showText={!collapsed} />
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1.5 px-3 py-4">
          {NAV.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>
        {!collapsed && (
          <div className="mx-3 mb-3 rounded-2xl bg-hero-gradient p-4 text-white">
            <p className="text-sm font-bold">Simulated bank</p>
            <p className="mt-1 text-xs leading-relaxed text-white/90">Play freely. No real money is ever moved.</p>
          </div>
        )}
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSidebar())} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border px-6 print:!hidden">
          <span className="lg:hidden">
            <BrandMark />
          </span>
          <div className="ml-auto flex items-center gap-3">
            <SimulatedChip />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 w-11 rounded-full p-0" aria-label="Account menu">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-elev-1">
                    <AvatarFallback className="text-sm font-bold text-white" style={{ background: avatarGradient(user?.name) }}>
                      {initials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <p className="text-sm">{user?.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={reduceEffects} onCheckedChange={(v) => dispatch(setReduceEffects(v))}>
                  Reduce effects
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 p-6 pb-28 outline-none lg:p-10 lg:pb-10 print:p-0">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileDock />
    </div>
  );
}
