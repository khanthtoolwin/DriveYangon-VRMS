import { Link } from "wouter";
import { Users, Fuel, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Vehicle } from "@shared/schema";
import { formatMMK, VEHICLE_STATUS_STYLES, resolveImageUrl } from "@/lib/format";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const unavailable = vehicle.status !== "available";

  return (
    <Link href={`/cars/${vehicle.id}`} data-testid={`link-vehicle-${vehicle.id}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover-elevate active-elevate-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={resolveImageUrl(vehicle.imageUrl)}
            alt={vehicle.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <Badge className={`absolute right-3 top-3 border capitalize ${VEHICLE_STATUS_STYLES[vehicle.status]}`}>
            {vehicle.status}
          </Badge>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{vehicle.category}</p>
              <h3 className="font-display text-base font-bold leading-tight text-foreground" data-testid={`text-vehicle-name-${vehicle.id}`}>
                {vehicle.name}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {vehicle.seats}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {vehicle.transmission}
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" /> {vehicle.fuelType}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-display text-base font-bold text-foreground" data-testid={`text-vehicle-price-${vehicle.id}`}>
              {formatMMK(vehicle.pricePerDay)}
            </span>
            <span className="text-xs text-muted-foreground">/ day</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
