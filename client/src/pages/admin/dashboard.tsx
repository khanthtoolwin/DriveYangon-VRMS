import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Car, CalendarClock, Wrench, Wallet, ClipboardList } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMMK, formatDate, BOOKING_STATUS_STYLES } from "@/lib/format";

interface Stats {
  totalVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  pendingBookings: number;
  activeRentals: number;
  totalRevenue: number;
  recentBookings: Array<{
    id: number;
    customerName: string;
    status: string;
    totalCost: number;
    createdAt: string;
    startDate: string;
    endDate: string;
  }>;
  byCategory: Record<string, number>;
}

const CHART_COLORS = ["#f2760f", "#2f8fca", "#3aa374", "#e0b32f", "#8a63d2", "#c65b7c"];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });

  const categoryData = stats
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <AdminLayout title="Dashboard Overview" description="Fleet status and booking activity at a glance">
      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard icon={Car} label="Total Vehicles" value={stats.totalVehicles} testId="kpi-total-vehicles" />
            <KpiCard icon={Car} label="Available Now" value={stats.availableVehicles} accent="success" testId="kpi-available-vehicles" />
            <KpiCard icon={Wrench} label="In Maintenance" value={stats.maintenanceVehicles} accent="warning" testId="kpi-maintenance-vehicles" />
            <KpiCard icon={ClipboardList} label="Pending Bookings" value={stats.pendingBookings} accent="warning" testId="kpi-pending-bookings" />
            <KpiCard icon={CalendarClock} label="Active Rentals" value={stats.activeRentals} accent="success" testId="kpi-active-rentals" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Revenue (approved + completed)</h2>
              </div>
              <p className="font-display text-xl font-bold tabular-nums text-foreground" data-testid="text-total-revenue">
                {formatMMK(stats.totalRevenue)}
              </p>
              <div className="mt-6">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Fleet by category</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {categoryData.map((c, i) => (
                    <span key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name} ({c.value})
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Recent bookings</h2>
                <Link href="/admin/bookings" className="text-xs text-primary hover:underline" data-testid="link-view-all-bookings">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {stats.recentBookings.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet</p>
                )}
                {stats.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                    data-testid={`row-recent-booking-${b.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums text-foreground">{formatMMK(b.totalCost)}</span>
                      <Badge className={`border capitalize ${BOOKING_STATUS_STYLES[b.status]}`}>{b.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  testId,
}: {
  icon: typeof Car;
  label: string;
  value: number;
  accent?: "success" | "warning";
  testId: string;
}) {
  return (
    <Card className="p-4" data-testid={testId}>
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-md ${
          accent === "success"
            ? "bg-success-bg text-success"
            : accent === "warning"
              ? "bg-warning-bg text-warning"
              : "bg-accent text-accent-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
