import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Car as CarIcon } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer } from "@/context/customer-context";
import type { Booking, Vehicle } from "@shared/schema";
import { formatMMK, formatDate, BOOKING_STATUS_STYLES, resolveImageUrl } from "@/lib/format";

export default function RentalHistory() {
  const { customer, setCustomer } = useCustomer();
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState(customer.name);
  const [emailInput, setEmailInput] = useState(customer.email);

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: [`/api/bookings?customerEmail=${encodeURIComponent(customer.email)}`],
  });
  const { data: vehicles } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });

  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">My Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-history-identity">
              Showing rentals for {customer.name} ({customer.email})
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNameInput(customer.name);
              setEmailInput(customer.email);
              setEditOpen(true);
            }}
            data-testid="button-edit-identity"
          >
            <Pencil className="mr-2 h-3.5 w-3.5" /> Switch customer
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center" data-testid="text-no-bookings">
            <CarIcon className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No bookings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Browse the catalog to make your first booking</p>
            <Button asChild className="mt-4" data-testid="link-browse-catalog">
              <Link href="/">Browse Cars</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3" data-testid="list-bookings">
            {bookings.map((b) => {
              const vehicle = vehicleById.get(b.vehicleId);
              return (
                <Card key={b.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center" data-testid={`card-booking-${b.id}`}>
                  {vehicle && (
                    <img src={resolveImageUrl(vehicle.imageUrl)} alt={vehicle.name} className="h-20 w-28 shrink-0 rounded-md object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{vehicle?.name ?? `Vehicle #${b.vehicleId}`}</p>
                      <Badge className={`border capitalize ${BOOKING_STATUS_STYLES[b.status]}`}>{b.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)} &middot; {b.days} day{b.days !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <span className="font-display text-base font-bold text-foreground">{formatMMK(b.totalCost)}</span>
                    <Link href={`/bookings/${b.id}/confirmation`} className="text-xs text-primary hover:underline" data-testid={`link-booking-detail-${b.id}`}>
                      View details
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="switch-name">Full name</Label>
              <Input id="switch-name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} data-testid="input-switch-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="switch-email">Email</Label>
              <Input id="switch-email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} data-testid="input-switch-email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} data-testid="button-cancel-switch">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setCustomer({ name: nameInput, email: emailInput });
                setEditOpen(false);
              }}
              data-testid="button-save-switch"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
