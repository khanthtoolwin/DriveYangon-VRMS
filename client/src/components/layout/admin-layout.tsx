import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Car, ClipboardList, ExternalLink } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
];

export function AdminLayout({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  const [location] = useLocation();

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] overflow-hidden bg-background md:grid-cols-[16rem_1fr] md:grid-rows-1">
      <aside
        className="row-start-1 flex flex-col overflow-y-auto border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:row-span-1 md:border-b-0 md:border-r"
        style={{ overscrollBehavior: "contain" }}
        data-testid="sidebar-admin"
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <LogoMark className="h-8 w-8 shrink-0" />
          <div>
            <p className="font-display text-sm font-bold leading-tight tracking-wide">
              Drive<span className="text-sidebar-primary">Yangon</span>
            </p>
            <p className="text-xs text-sidebar-foreground/60">Staff Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-admin-nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/"
            data-testid="link-view-customer-site"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            View Customer Site
          </Link>
        </div>
      </aside>
      <div className="flex min-h-0 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background px-4 py-4 sm:px-6 md:px-8">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground" data-testid="text-page-title">
              {title}
            </h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <ThemeToggle />
        </header>
        <main
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8"
          style={{ overscrollBehavior: "contain" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
