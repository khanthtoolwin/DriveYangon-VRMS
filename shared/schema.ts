import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export const VEHICLE_CATEGORIES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Van",
  "Pickup",
  "Luxury",
] as const;

export const VEHICLE_STATUSES = ["available", "maintenance", "retired"] as const;

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  year: integer("year").notNull(),
  pricePerDay: integer("price_per_day").notNull(),
  seats: integer("seats").notNull(),
  transmission: text("transmission").notNull(), // Automatic | Manual
  fuelType: text("fuel_type").notNull(), // Petrol | Diesel | Hybrid | Electric
  licensePlate: text("license_plate").notNull().unique(),
  location: text("location").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("available"), // available | maintenance | retired
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true }).extend({
  category: z.enum(VEHICLE_CATEGORIES),
  status: z.enum(VEHICLE_STATUSES),
  pricePerDay: z.coerce.number().int().positive(),
  seats: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(1990).max(2100),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
] as const;

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  startDate: text("start_date").notNull(), // ISO yyyy-mm-dd
  endDate: text("end_date").notNull(), // ISO yyyy-mm-dd
  days: integer("days").notNull(),
  ratePerDay: integer("rate_per_day").notNull(),
  totalCost: integer("total_cost").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ id: true, days: true, ratePerDay: true, totalCost: true, createdAt: true, status: true, note: true })
  .extend({
    customerName: z.string().min(2, "Enter your full name"),
    customerEmail: z.string().email("Enter a valid email"),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  });

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  note: z.string().optional(),
});
