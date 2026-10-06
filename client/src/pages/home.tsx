import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { VehicleCard, VehicleCardSkeleton } from "@/components/vehicles/vehicle-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_CATEGORIES, type Vehicle } from "@shared/schema";

const PRICE_BANDS = [
  { label: "Any price", value: "any" },
  { label: "Under 40,000 MMK", value: "0-40000" },
  { label: "40,000 \u2013 70,000 MMK", value: "40000-70000" },
  { label: "Over 70,000 MMK", value: "70000-999999" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [priceBand, setPriceBand] = useState<string>("any");

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    const [min, max] = priceBand === "any" ? [0, Infinity] : priceBand.split("-").map(Number);
    return vehicles.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || v.category === category;
      const matchesPrice = v.pricePerDay >= min && v.pricePerDay <= max;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [vehicles, search, category, priceBand]);

  return (
    <PublicLayout>
      <section className="border-b border-border bg-gradient-to-b from-accent/50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Yangon's rental fleet, online</p>
          <h1 className="font-display max-w-2xl text-xl font-bold leading-tight text-foreground sm:text-2xl">
            Book a car in minutes. No calls, no paperwork, no double bookings.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Browse our fleet, check live availability, and confirm your rental online &mdash; from downtown Yangon to Hlaing and beyond.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by car name..."
              className="pl-9"
              data-testid="input-search-vehicles"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-44" data-testid="select-category-filter">
              <SlidersHorizontal className="mr-1 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {VEHICLE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priceBand} onValueChange={setPriceBand}>
            <SelectTrigger className="sm:w-52" data-testid="select-price-filter">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_BANDS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || category !== "all" || priceBand !== "any") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setPriceBand("any");
              }}
              data-testid="button-clear-filters"
            >
              Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center" data-testid="text-no-vehicles">
            <p className="font-medium text-foreground">No cars match your search</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="grid-vehicles">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
