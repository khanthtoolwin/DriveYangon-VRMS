import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Ban, CheckCheck } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Booking, Vehicle, BOOKING_STATUSES } from "@shared/schema";
import { formatMMK, formatDate, BOOKING_STATUS_STYLES } from "@/lib/format";

type StatusFilter = "all" | (typeof BOOKING_STATUSES)[number];

export default function AdminBookings() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data: bookings, isLoading } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });
  const { data: vehicles } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: `Booking #${variables.id} marked ${variables.status}` });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Update failed", description: err.message.replace(/^\d+:\s*/, "") });
    },
  });

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings?.length ?? 0 };
    for (const b of bookings ?? []) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [bookings]);

  return (
    <AdminLayout title="Booking Management" description="Review, approve, and track customer bookings">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)} className="mb-4">
        <TabsList className="flex-wrap">
          {(["all", "pending", "approved", "rejected", "completed", "cancelled"] as const).map((s) => (
            <TabsTrigger key={s} value={s} data-testid={`tab-status-${s}`} className="capitalize">
              {s} {counts[s] ? <span className="ml-1 text-muted-foreground">({counts[s]})</span> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground" data-testid="text-no-bookings-admin">
            No bookings in this view
          </p>
        ) : (
          <Table data-testid="table-bookings">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const vehicle = vehicleById.get(b.vehicleId);
                return (
                  <TableRow key={b.id} data-testid={`row-booking-${b.id}`}>
                    <TableCell>
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                    </TableCell>
                    <TableCell>{vehicle?.name ?? `#${b.vehicleId}`}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMMK(b.totalCost)}</TableCell>
                    <TableCell>
                      <Badge className={`border capitalize ${BOOKING_STATUS_STYLES[b.status]}`}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {b.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Approve"
                              onClick={() => statusMutation.mutate({ id: b.id, status: "approved" })}
                              data-testid={`button-approve-booking-${b.id}`}
                            >
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reject"
                              onClick={() => statusMutation.mutate({ id: b.id, status: "rejected" })}
                              data-testid={`button-reject-booking-${b.id}`}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {b.status === "approved" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Mark completed"
                              onClick={() => statusMutation.mutate({ id: b.id, status: "completed" })}
                              data-testid={`button-complete-booking-${b.id}`}
                            >
                              <CheckCheck className="h-4 w-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Cancel"
                              onClick={() => statusMutation.mutate({ id: b.id, status: "cancelled" })}
                              data-testid={`button-cancel-booking-${b.id}`}
                            >
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {(b.status === "rejected" || b.status === "completed" || b.status === "cancelled") && (
                          <span className="text-xs text-muted-foreground">No actions</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
}
