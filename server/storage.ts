import { users, vehicles, bookings } from "@shared/schema";
import type {
  User,
  InsertUser,
  Vehicle,
  InsertVehicle,
  Booking,
  InsertBooking,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// ---------------------------------------------------------------------------
// Schema bootstrap (no migrations tool wired up for this prototype — create
// tables directly if they don't already exist).
// ---------------------------------------------------------------------------
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER NOT NULL,
    price_per_day INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    transmission TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    license_plate TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    rate_per_day INTEGER NOT NULL,
    total_cost INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at TEXT NOT NULL
  );
`);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  listVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  listBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByEmail(email: string): Promise<Booking[]>;
  getOverlappingBookings(vehicleId: number, startDate: string, endDate: string): Promise<Booking[]>;
  createBooking(data: {
    vehicleId: number;
    customerName: string;
    customerEmail: string;
    startDate: string;
    endDate: string;
    days: number;
    ratePerDay: number;
    totalCost: number;
  }): Promise<Booking>;
  updateBookingStatus(id: number, status: string, note?: string): Promise<Booking | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async listVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles).all();
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return db.select().from(vehicles).where(eq(vehicles.id, id)).get();
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    return db.insert(vehicles).values(vehicle).returning().get();
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    return db.update(vehicles).set(vehicle).where(eq(vehicles.id, id)).returning().get();
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = db.delete(vehicles).where(eq(vehicles.id, id)).run();
    return result.changes > 0;
  }

  async listBookings(): Promise<Booking[]> {
    return db.select().from(bookings).all();
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return db.select().from(bookings).where(eq(bookings.id, id)).get();
  }

  async getBookingsByEmail(email: string): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.customerEmail, email.toLowerCase()))
      .all();
  }

  async getOverlappingBookings(
    vehicleId: number,
    startDate: string,
    endDate: string
  ): Promise<Booking[]> {
    const all = db.select().from(bookings).where(eq(bookings.vehicleId, vehicleId)).all();
    return all.filter(
      (b) =>
        (b.status === "pending" || b.status === "approved") &&
        startDate <= b.endDate &&
        endDate >= b.startDate
    );
  }

  async createBooking(data: {
    vehicleId: number;
    customerName: string;
    customerEmail: string;
    startDate: string;
    endDate: string;
    days: number;
    ratePerDay: number;
    totalCost: number;
  }): Promise<Booking> {
    return db
      .insert(bookings)
      .values({
        ...data,
        customerEmail: data.customerEmail.toLowerCase(),
        status: "pending",
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async updateBookingStatus(id: number, status: string, note?: string): Promise<Booking | undefined> {
    return db
      .update(bookings)
      .set({ status, ...(note !== undefined ? { note } : {}) })
      .where(eq(bookings.id, id))
      .returning()
      .get();
  }
}

export const storage = new DatabaseStorage();

// ---------------------------------------------------------------------------
// Demo seed data — only runs once, when the vehicles table is empty.
// ---------------------------------------------------------------------------
export async function seedIfEmpty() {
  const existing = await storage.listVehicles();
  if (existing.length > 0) return;

  const seedVehicles: InsertVehicle[] = [
    {
      name: "Toyota Corolla Altis",
      category: "Sedan",
      year: 2022,
      pricePerDay: 45000,
      seats: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      licensePlate: "YGN-1024",
      location: "Yangon Downtown Branch",
      imageUrl: "/vehicles/sedan-corolla.png",
      description:
        "A reliable, fuel-efficient sedan perfect for city commuting and short business trips around Yangon.",
      status: "available",
    },
    {
      name: "Honda Vezel Hybrid",
      category: "SUV",
      year: 2023,
      pricePerDay: 68000,
      seats: 5,
      transmission: "Automatic",
      fuelType: "Hybrid",
      licensePlate: "YGN-2091",
      location: "Yangon Downtown Branch",
      imageUrl: "/vehicles/suv-vezel.png",
      description:
        "Compact hybrid SUV with excellent mileage, raised seating position, and generous cargo room for family trips.",
      status: "available",
    },
    {
      name: "Toyota Hiace Commuter",
      category: "Van",
      year: 2021,
      pricePerDay: 95000,
      seats: 12,
      transmission: "Manual",
      fuelType: "Diesel",
      licensePlate: "YGN-3350",
      location: "Mingalar Taung Nyunt Branch",
      imageUrl: "/vehicles/van-hiace.png",
      description:
        "Spacious 12-seat van ideal for group travel, airport transfers, and out-of-town tours.",
      status: "available",
    },
    {
      name: "Suzuki Swift",
      category: "Hatchback",
      year: 2020,
      pricePerDay: 32000,
      seats: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      licensePlate: "YGN-0847",
      location: "Hlaing Branch",
      imageUrl: "/vehicles/hatchback-swift.png",
      description:
        "Nimble and easy to park hatchback, a budget-friendly pick for solo travelers and small errands.",
      status: "available",
    },
    {
      name: "Toyota Hilux Revo",
      category: "Pickup",
      year: 2022,
      pricePerDay: 78000,
      seats: 5,
      transmission: "Manual",
      fuelType: "Diesel",
      licensePlate: "YGN-4471",
      location: "Mingalar Taung Nyunt Branch",
      imageUrl: "/vehicles/pickup-hilux.png",
      description:
        "Rugged double-cab pickup with strong towing capacity, well suited for cargo runs and rough roads.",
      status: "maintenance",
    },
    {
      name: "Toyota Alphard",
      category: "Luxury",
      year: 2023,
      pricePerDay: 150000,
      seats: 7,
      transmission: "Automatic",
      fuelType: "Petrol",
      licensePlate: "YGN-5502",
      location: "Yangon Downtown Branch",
      imageUrl: "/vehicles/luxury-alphard.png",
      description:
        "Premium chauffeur-grade minivan with plush captain's seats — the top pick for VIP transport and weddings.",
      status: "available",
    },
    {
      name: "Nissan X-Trail",
      category: "SUV",
      year: 2021,
      pricePerDay: 62000,
      seats: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      licensePlate: "YGN-6683",
      location: "Hlaing Branch",
      imageUrl: "/vehicles/suv-xtrail.png",
      description:
        "Comfortable mid-size SUV with all-weather capability, great for weekend trips outside the city.",
      status: "available",
    },
    {
      name: "Honda City",
      category: "Sedan",
      year: 2023,
      pricePerDay: 42000,
      seats: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      licensePlate: "YGN-7729",
      location: "Hlaing Branch",
      imageUrl: "/vehicles/sedan-city.png",
      description:
        "Modern, sharp-handling sedan with a comfortable cabin — a favorite for daily business rentals.",
      status: "available",
    },
  ];

  const inserted: Vehicle[] = [];
  for (const v of seedVehicles) {
    inserted.push(await storage.createVehicle(v));
  }

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const sampleBookings = [
    {
      vehicle: inserted[0],
      customerName: "Aung Ko Ko Min",
      customerEmail: "aungkokomin@example.com",
      start: addDays(today, -6),
      end: addDays(today, -2),
      status: "completed",
    },
    {
      vehicle: inserted[1],
      customerName: "Aung Ko Ko Min",
      customerEmail: "aungkokomin@example.com",
      start: addDays(today, 1),
      end: addDays(today, 4),
      status: "approved",
    },
    {
      vehicle: inserted[5],
      customerName: "Aung Ko Ko Min",
      customerEmail: "aungkokomin@example.com",
      start: addDays(today, 10),
      end: addDays(today, 12),
      status: "pending",
    },
    {
      vehicle: inserted[2],
      customerName: "Khant Htoo Lwin",
      customerEmail: "khanthtoolwin@example.com",
      start: addDays(today, 2),
      end: addDays(today, 3),
      status: "pending",
    },
    {
      vehicle: inserted[6],
      customerName: "Ye Wint Phyo",
      customerEmail: "yewintphyo@example.com",
      start: addDays(today, -1),
      end: addDays(today, 2),
      status: "approved",
    },
    {
      vehicle: inserted[3],
      customerName: "Lynn Htet Aung",
      customerEmail: "lynnhtetaung@example.com",
      start: addDays(today, -10),
      end: addDays(today, -8),
      status: "rejected",
    },
  ];

  for (const b of sampleBookings) {
    const days = Math.max(
      1,
      Math.round((b.end.getTime() - b.start.getTime()) / 86400000)
    );
    const totalCost = days * b.vehicle.pricePerDay;
    const created = await storage.createBooking({
      vehicleId: b.vehicle.id,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      startDate: iso(b.start),
      endDate: iso(b.end),
      days,
      ratePerDay: b.vehicle.pricePerDay,
      totalCost,
    });
    if (b.status !== "pending") {
      await storage.updateBookingStatus(created.id, b.status);
    }
  }
}
