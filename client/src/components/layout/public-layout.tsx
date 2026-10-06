import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/context/customer-context";
import { ThemeToggle } from "@/components/theme-toggle";

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const [location] = useLocation();
  const active = location === href;
  return (
    <Link
      href={href}
      data-testid={`link-nav-${href === "/" ? "home" : href.slice(1)}`}
      className={`text-sm font-medium transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { customer } = useCustomer();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" data-testid="link-home-logo">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/">Browse Cars</NavLink>
            <NavLink href="/history">My Bookings</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline" data-testid="text-current-customer">
              {customer.name}
            </span>
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" data-testid="link-staff-portal">
              <Link href="/admin">Staff Portal</Link>
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-5 border-t border-border px-4 py-2 md:hidden">
          <NavLink href="/">Browse Cars</NavLink>
          <NavLink href="/history">My Bookings</NavLink>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo className="opacity-80" />
          <p>Vehicle Rental Management System &mdash; University of Computer Studies, Yangon</p>
        </div>
      </footer>
    </div>
  );
}
