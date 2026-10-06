import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCustomer } from "@/context/customer-context";
import { insertBookingSchema, type Vehicle, type Booking } from "@shared/schema";
import { formatMMK, resolveImageUrl } from "@/lib/format";
import { z } from "zod";

const formSchema = insertBookingSchema.omit({ vehicleId: true }).extend({ note: z.string().optional() });
type FormValues = z.infer<typeof formSchema>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingForm() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { customer, setCustomer } = useCustomer();
  const vehicleId = Number(id);

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${id}`],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customerName: customer.name,
      customerEmail: customer.email,
      startDate: todayISO(),
      endDate: todayISO(),
      note: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const availability = useQuery<{ available: boolean; conflicts: number }>({
    queryKey: [`/api/availability?vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}`],
    enabled: Boolean(vehicleId && startDate && endDate && endDate >= startDate),
  });

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const a = new Date(startDate + "T00:00:00").getTime();
    const b = new Date(endDate + "T00:00:00").getTime();
    return Math.max(1, Math.round((b - a) / 86400000));
  }, [startDate, endDate]);

  const totalCost = vehicle ? days * vehicle.pricePerDay : 0;

  const bookingMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/bookings", { ...values, vehicleId });
      return (await res.json()) as Booking;
    },
    onSuccess: (booking) => {
      setCustomer({ name: booking.customerName, email: booking.customerEmail });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setLocation(`/bookings/${booking.id}/confirmation`);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Booking failed", description: err.message.replace(/^\d+:\s*/, "") });
    },
  });

  useEffect(() => {
    if (endDate < startDate) {
      form.setValue("endDate", startDate);
    }
  }, [startDate]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
      </PublicLayout>
    );
  }

  if (!vehicle) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <p className="font-medium text-foreground">Car not found</p>
        </div>
      </PublicLayout>
    );
  }

  const isBlocked = availability.data && !availability.data.available;

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href={`/cars/${vehicle.id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-back-to-car"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {vehicle.name}
        </Link>

        <div className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <img src={resolveImageUrl(vehicle.imageUrl)} alt={vehicle.name} className="h-16 w-24 rounded-md object-cover" />
          <div>
            <h1 className="font-display text-base font-bold text-foreground">Book {vehicle.name}</h1>
            <p className="text-sm text-muted-foreground">{formatMMK(vehicle.pricePerDay)} / day</p>
          </div>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => bookingMutation.mutate(values))}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup date</FormLabel>
                      <FormControl>
                        <Input type="date" min={todayISO()} {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return date</FormLabel>
                      <FormControl>
                        <Input type="date" min={startDate || todayISO()} {...field} data-testid="input-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div
                className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                  availability.isLoading
                    ? "border-border bg-muted text-muted-foreground"
                    : isBlocked
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-success/30 bg-success-bg text-success"
                }`}
                data-testid="text-availability-status"
              >
                {availability.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                  </>
                ) : isBlocked ? (
                  <>
                    <XCircle className="h-4 w-4" /> Already booked for part of these dates. Pick different dates.
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Available for your selected dates
                  </>
                )}
              </div>

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} data-testid="input-customer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} data-testid="input-customer-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Any special requests" value={field.value ?? ""} onChange={field.onChange} data-testid="input-note" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between rounded-md bg-accent p-4">
                <span className="text-sm text-accent-foreground">
                  {days} day{days !== 1 ? "s" : ""} &times; {formatMMK(vehicle.pricePerDay)}
                </span>
                <span className="font-display text-base font-bold text-accent-foreground" data-testid="text-estimated-total">
                  {formatMMK(totalCost)}
                </span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={bookingMutation.isPending || Boolean(isBlocked)}
                data-testid="button-confirm-booking"
              >
                {bookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </PublicLayout>
  );
}
