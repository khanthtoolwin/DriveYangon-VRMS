import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Fuel, Gauge, MapPin, Calendar } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@shared/schema";
import { formatMMK, VEHICLE_STATUS_STYLES, resolveImageUrl } from "@/lib/format";

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${id}`],
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Skeleton className="mb-6 h-6 w-32" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!vehicle) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6" data-testid="text-vehicle-not-found">
          <p className="font-medium text-foreground">Car not found</p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Back to catalog
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const unavailable = vehicle.status !== "available";

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-back-to-catalog"
        >
          <ArrowLeft className="h-4 w-4" /> Back to catalog
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={resolveImageUrl(vehicle.imageUrl)}
              alt={vehicle.name}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">{vehicle.category}</p>
              <Badge className={`border capitalize ${VEHICLE_STATUS_STYLES[vehicle.status]}`} data-testid="badge-vehicle-status">
                {vehicle.status}
              </Badge>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl" data-testid="text-vehicle-detail-name">
              {vehicle.name} <span className="font-normal text-muted-foreground">({vehicle.year})</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{vehicle.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Spec icon={Users} label="Seats" value={`${vehicle.seats}`} />
              <Spec icon={Gauge} label="Transmission" value={vehicle.transmission} />
              <Spec icon={Fuel} label="Fuel" value={vehicle.fuelType} />
              <Spec icon={MapPin} label="Branch" value={vehicle.location} />
            </div>

            <Card className="mt-6 flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-muted-foreground">Daily rate</p>
                <p className="font-display text-xl font-bold text-foreground" data-testid="text-vehicle-detail-price">
                  {formatMMK(vehicle.pricePerDay)}
                </p>
              </div>
              <Button asChild size="lg" disabled={unavailable} data-testid="button-book-now">
                {unavailable ? (
                  <span>Unavailable</span>
                ) : (
                  <Link href={`/cars/${vehicle.id}/book`}>
                    <Calendar className="mr-2 h-4 w-4" /> Book Now
                  </Link>
                )}
              </Button>
            </Card>
            {unavailable && (
              <p className="mt-2 text-xs text-muted-foreground">
                This vehicle is currently under {vehicle.status} and can't be booked right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <Icon className="mb-1.5 h-4 w-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
