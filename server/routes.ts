import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage, seedIfEmpty } from "./storage";
import { insertVehicleSchema, insertBookingSchema, updateBookingStatusSchema } from "@shared/schema";

function daysBetween(start: string, end: string): number {
  const a = new Date(start + "T00:00:00Z").getTime();
  const b = new Date(end + "T00:00:00Z").getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedIfEmpty();

  // ---------------------------------------------------------------------
  // Vehicles
  // ---------------------------------------------------------------------
  app.get("/api/vehicles", async (_req, res) => {
    const vehicles = await storage.listVehicles();
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(Number(req.params.id));
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  });

  app.post("/api/vehicles", async (req, res) => {
    const parsed = insertVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid vehicle data" });
    }
    try {
      const vehicle = await storage.createVehicle(parsed.data);
      res.status(201).json(vehicle);
    } catch (err: any) {
      res.status(400).json({ message: err?.message?.includes("UNIQUE") ? "License plate already exists" : "Could not create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    const parsed = insertVehicleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid vehicle data" });
    }
    try {
      const vehicle = await storage.updateVehicle(Number(req.params.id), parsed.data);
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
      res.json(vehicle);
    } catch (err: any) {
      res.status(400).json({ message: err?.message?.includes("UNIQUE") ? "License plate already exists" : "Could not update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const ok = await storage.deleteVehicle(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Vehicle not found" });
    res.status(204).end();
  });

  // ---------------------------------------------------------------------
  // Availability check
  // ---------------------------------------------------------------------
  app.get("/api/availability", async (req, res) => {
    const vehicleId = Number(req.query.vehicleId);
    const startDate = String(req.query.startDate ?? "");
    const endDate = String(req.query.endDate ?? "");
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ message: "vehicleId, startDate and endDate are required" });
    }
    const overlaps = await storage.getOverlappingBookings(vehicleId, startDate, endDate);
    res.json({ available: overlaps.length === 0, conflicts: overlaps.length });
  });

  // ---------------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------------
  app.get("/api/bookings", async (req, res) => {
    const email = req.query.customerEmail ? String(req.query.customerEmail) : undefined;
    const list = email ? await storage.getBookingsByEmail(email) : await storage.listBookings();
    res.json(list);
  });

  app.get("/api/bookings/:id", async (req, res) => {
    const booking = await storage.getBooking(Number(req.params.id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  });

  app.post("/api/bookings", async (req, res) => {
    const parsed = insertBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid booking data" });
    }
    const { vehicleId, startDate, endDate, customerName, customerEmail } = parsed.data;

    if (endDate < startDate) {
      return res.status(400).json({ message: "Return date must be after the pickup date" });
    }

    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (vehicle.status !== "available") {
      return res.status(409).json({ message: "This vehicle is not currently available for booking" });
    }

    const overlaps = await storage.getOverlappingBookings(vehicleId, startDate, endDate);
    if (overlaps.length > 0) {
      return res.status(409).json({
        message: "This vehicle is already booked for part of your selected dates. Please choose different dates.",
      });
    }

    const days = daysBetween(startDate, endDate);
    const totalCost = days * vehicle.pricePerDay;

    const booking = await storage.createBooking({
      vehicleId,
      customerName,
      customerEmail,
      startDate,
      endDate,
      days,
      ratePerDay: vehicle.pricePerDay,
      totalCost,
    });

    res.status(201).json(booking);
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    const parsed = updateBookingStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid status" });
    }
    const booking = await storage.updateBookingStatus(Number(req.params.id), parsed.data.status, parsed.data.note);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  });

  // ---------------------------------------------------------------------
  // Admin dashboard stats
  // ---------------------------------------------------------------------
  app.get("/api/stats", async (_req, res) => {
    const vehicles = await storage.listVehicles();
    const bookingList = await storage.listBookings();
    const today = new Date().toISOString().slice(0, 10);

    const totalVehicles = vehicles.length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
    const bookedVehicleIds = new Set(
      bookingList
        .filter((b) => b.status === "approved" && b.startDate <= today && b.endDate >= today)
        .map((b) => b.vehicleId)
    );
    const availableVehicles = vehicles.filter(
      (v) => v.status === "available" && !bookedVehicleIds.has(v.id)
    ).length;

    const pendingBookings = bookingList.filter((b) => b.status === "pending").length;
    const activeRentals = bookingList.filter(
      (b) => b.status === "approved" && b.startDate <= today && b.endDate >= today
    ).length;
    const totalRevenue = bookingList
      .filter((b) => b.status === "approved" || b.status === "completed")
      .reduce((sum, b) => sum + b.totalCost, 0);

    const recentBookings = [...bookingList]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 8);

    const byCategory: Record<string, number> = {};
    for (const v of vehicles) {
      byCategory[v.category] = (byCategory[v.category] ?? 0) + 1;
    }

    res.json({
      totalVehicles,
      availableVehicles,
      maintenanceVehicles,
      pendingBookings,
      activeRentals,
      totalRevenue,
      recentBookings,
      byCategory,
    });
  });

  return httpServer;
}
