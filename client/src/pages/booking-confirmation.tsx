import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Car as CarIcon } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, Vehicle } from "@shared/schema";
import { formatMMK, formatDate, BOOKING_STATUS_STYLES, resolveImageUrl } from "@/lib/format";

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: [`/api/bookings/${id}`],
  });
  const { data: vehicle } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${booking?.vehicleId}`],
    enabled: Boolean(booking?.vehicleId),
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
          <Skeleton className="h-40 w-full" />
        </div>
      </PublicLayout>
    );
  }

  if (!booking) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
          <p className="font-medium text-foreground">Booking not found</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Booking request sent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll review and confirm booking #{booking.id} shortly.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge className={`border capitalize ${BOOKING_STATUS_STYLES[booking.status]}`} data-testid="badge-booking-status">
              {booking.status}
            </Badge>
          </div>

          {vehicle && (
            <div className="flex items-center gap-3 border-b border-border py-4">
              <img src={resolveImageUrl(vehicle.imageUrl)} alt={vehicle.name} className="h-14 w-20 rounded-md object-cover" />
              <div>
                <p className="font-medium text-foreground" data-testid="text-confirmation-vehicle">
                  {vehicle.name}
                </p>
                <p className="text-xs text-muted-foreground">{vehicle.category} &middot; {vehicle.location}</p>
              </div>
            </div>
          )}

          <dl className="space-y-3 py-4 text-sm">
            <Row label="Pickup date" value={formatDate(booking.startDate)} />
            <Row label="Return date" value={formatDate(booking.endDate)} />
            <Row label="Duration" value={`${booking.days} day${booking.days !== 1 ? "s" : ""}`} />
            <Row label="Rate per day" value={formatMMK(booking.ratePerDay)} />
            <Row label="Renter" value={booking.customerName} />
            <Row label="Email" value={booking.customerEmail} />
          </dl>

          <div className="flex items-center justify-between rounded-md bg-accent p-4">
            <span className="text-sm font-medium text-accent-foreground">Total billing</span>
            <span className="font-display text-xl font-bold text-accent-foreground" data-testid="text-confirmation-total">
              {formatMMK(booking.totalCost)}
            </span>
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1" data-testid="link-view-history">
            <Link href="/history">View my bookings</Link>
          </Button>
          <Button asChild className="flex-1" data-testid="link-browse-more">
            <Link href="/">
              <CarIcon className="mr-2 h-4 w-4" /> Browse more cars
            </Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
