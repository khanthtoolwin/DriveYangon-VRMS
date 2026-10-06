import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  insertVehicleSchema,
  VEHICLE_CATEGORIES,
  VEHICLE_STATUSES,
  type InsertVehicle,
  type Vehicle,
} from "@shared/schema";
import { formatMMK, VEHICLE_STATUS_STYLES, resolveImageUrl } from "@/lib/format";

type VehicleFormValues = InsertVehicle;

const emptyDefaults: VehicleFormValues = {
  name: "",
  category: "Sedan",
  year: new Date().getFullYear(),
  pricePerDay: 30000,
  seats: 5,
  transmission: "Automatic",
  fuelType: "Petrol",
  licensePlate: "",
  location: "Yangon Downtown Branch",
  imageUrl: "/vehicles/sedan-city.png",
  description: "",
  status: "available",
};

export default function AdminVehicles() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(insertVehicleSchema) as any,
    defaultValues: emptyDefaults,
  });

  function openCreate() {
    setEditing(null);
    form.reset(emptyDefaults);
    setDialogOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    form.reset(vehicle as unknown as VehicleFormValues);
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      if (editing) {
        const res = await apiRequest("PATCH", `/api/vehicles/${editing.id}`, values);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/vehicles", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: editing ? "Vehicle updated" : "Vehicle added" });
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Save failed", description: err.message.replace(/^\d+:\s*/, "") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      await apiRequest("DELETE", `/api/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehicle removed" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Delete failed", description: err.message.replace(/^\d+:\s*/, "") });
    },
  });

  return (
    <AdminLayout title="Vehicle Management" description="Add, edit, and retire fleet vehicles">
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} data-testid="button-add-vehicle">
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table data-testid="table-vehicles">
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price / day</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(vehicles ?? []).map((v) => (
                <TableRow key={v.id} data-testid={`row-vehicle-${v.id}`}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <img src={resolveImageUrl(v.imageUrl)} alt={v.name} className="h-10 w-14 rounded object-cover" />
                    {v.name}
                  </TableCell>
                  <TableCell>{v.category}</TableCell>
                  <TableCell className="tabular-nums">{formatMMK(v.pricePerDay)}</TableCell>
                  <TableCell className="text-muted-foreground">{v.licensePlate}</TableCell>
                  <TableCell className="text-muted-foreground">{v.location}</TableCell>
                  <TableCell>
                    <Badge className={`border capitalize ${VEHICLE_STATUS_STYLES[v.status]}`}>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)} data-testid={`button-edit-vehicle-${v.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(v)} data-testid={`button-delete-vehicle-${v.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-vehicle-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-vehicle-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seats</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-vehicle-seats" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price / day</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-vehicle-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmission</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-vehicle-transmission" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel type</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-vehicle-fuel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License plate</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-vehicle-plate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-vehicle-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image path</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-vehicle-image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} data-testid="input-vehicle-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-vehicle">
                  {saveMutation.isPending ? "Saving..." : "Save Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the vehicle from the fleet catalog. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-vehicle"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
