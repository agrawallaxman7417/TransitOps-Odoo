// =====================================================================
// FILE: seed.js
// MODULE: CORE (Database Seeder)
// =====================================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");
const Trip = require("./models/Trip");
const Maintenance = require("./models/Maintenance");
const { FuelLog, Expense } = require("./models/FuelExpense");
const Settings = require("./models/Settings");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/transitops";

async function seed() {
  try {
    console.log("[SEED] Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("[SEED] Connected. Cleaning collections...");

    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Maintenance.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});
    await Settings.deleteMany({});

    console.log("[SEED] Collections cleared. Seeding users...");
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("password123", salt);

    const users = [
      {
        name: "Laxman Agrawal",
        email: "manager@transitops.in",
        passwordHash: defaultPasswordHash,
        role: "Fleet Manager",
      },
      {
        name: "Raven K.",
        email: "dispatcher@transitops.in",
        passwordHash: defaultPasswordHash,
        role: "Dispatcher",
      },
      {
        name: "John Doe",
        email: "safety@transitops.in",
        passwordHash: defaultPasswordHash,
        role: "Safety Officer",
      },
      {
        name: "Jane Smith",
        email: "finance@transitops.in",
        passwordHash: defaultPasswordHash,
        role: "Financial Analyst",
      },
    ];

    await User.insertMany(users);
    console.log("[SEED] Users seeded successfully.");

    console.log("[SEED] Seeding settings...");
    await Settings.create({
      depotName: "Gandhinagar Depot GJ4",
      currency: "INR (Rs)",
      distanceUnit: "Kilometers",
    });

    console.log("[SEED] Seeding vehicles...");
    const vehiclesData = [
      { regNumber: "GJ01-AB-1234", name: "Tata Ace Mini", type: "Mini", maxLoadKg: 850, odometer: 12450, acquisitionCost: 450000, status: "Available" },
      { regNumber: "GJ01-CD-5678", name: "Mahindra Bolero Pickup", type: "Van", maxLoadKg: 1250, odometer: 34200, acquisitionCost: 720000, status: "Available" },
      { regNumber: "GJ01-EF-9012", name: "Ashok Leyland Dost", type: "Van", maxLoadKg: 1500, odometer: 18900, acquisitionCost: 680000, status: "On Trip" },
      { regNumber: "GJ01-GH-3456", name: "Eicher Pro 2049 Truck", type: "Truck", maxLoadKg: 3500, odometer: 67300, acquisitionCost: 1400000, status: "In Shop" },
      { regNumber: "GJ01-IJ-7890", name: "BharatBenz 1917R Large", type: "Truck", maxLoadKg: 10000, odometer: 95000, acquisitionCost: 2800000, status: "Retired" },
    ];
    const vehicles = await Vehicle.insertMany(vehiclesData);

    console.log("[SEED] Seeding drivers...");
    const driversData = [
      { name: "Ramesh Patel", licenseNumber: "DL-GJ01-2015-001", licenseCategory: "LMV", licenseExpiry: new Date("2028-12-31"), contact: "+91 98765 43210", safetyScore: 92, status: "Available" },
      { name: "Suresh Kumar", licenseNumber: "DL-GJ01-2012-002", licenseCategory: "HMV", licenseExpiry: new Date("2030-05-15"), contact: "+91 98765 43211", safetyScore: 88, status: "On Trip" },
      { name: "Vikram Singh", licenseNumber: "DL-GJ01-2018-003", licenseCategory: "HMV", licenseExpiry: new Date("2029-09-20"), contact: "+91 98765 43212", safetyScore: 95, status: "Available" },
      { name: "Dinesh Solanki", licenseNumber: "DL-GJ01-1999-004", licenseCategory: "HMV", licenseExpiry: new Date("2025-01-01"), contact: "+91 98765 43213", safetyScore: 74, status: "Available" }, // Expired license
      { name: "Amit Sharma", licenseNumber: "DL-GJ01-2020-005", licenseCategory: "LMV", licenseExpiry: new Date("2027-10-10"), contact: "+91 98765 43214", safetyScore: 55, status: "Suspended" },
      { name: "Rajesh Varma", licenseNumber: "DL-GJ01-2019-006", licenseCategory: "LMV", licenseExpiry: new Date("2029-04-18"), contact: "+91 98765 43215", safetyScore: 82, status: "Off Duty" },
    ];
    const drivers = await Driver.insertMany(driversData);

    console.log("[SEED] Seeding trips...");
    const tripsData = [
      {
        tripCode: "TR001",
        source: "Ahmedabad depot",
        destination: "Baroda warehouse",
        vehicle: vehicles[0]._id,
        driver: drivers[0]._id,
        cargoWeightKg: 500,
        plannedDistanceKm: 120,
        actualDistanceKm: 118,
        fuelConsumedLiters: 12,
        status: "Completed",
        createdAt: new Date("2026-06-01T08:00:00Z"),
      },
      {
        tripCode: "TR002",
        source: "Surat Port",
        destination: "Gandhinagar Depot",
        vehicle: vehicles[1]._id,
        driver: drivers[2]._id,
        cargoWeightKg: 1000,
        plannedDistanceKm: 250,
        actualDistanceKm: 255,
        fuelConsumedLiters: 28,
        status: "Completed",
        createdAt: new Date("2026-06-15T09:30:00Z"),
      },
      {
        tripCode: "TR003",
        source: "Gandhinagar Depot",
        destination: "Mehsana Dairy",
        vehicle: vehicles[2]._id,
        driver: drivers[1]._id,
        cargoWeightKg: 1200,
        plannedDistanceKm: 80,
        status: "Dispatched",
        createdAt: new Date(),
      },
      {
        tripCode: "TR004",
        source: "Rajkot GIDC",
        destination: "Ahmedabad Airport",
        vehicle: vehicles[0]._id,
        driver: drivers[0]._id,
        cargoWeightKg: 400,
        plannedDistanceKm: 220,
        status: "Draft",
        createdAt: new Date(),
      },
    ];
    const trips = await Trip.insertMany(tripsData);

    console.log("[SEED] Seeding maintenance log...");
    await Maintenance.create({
      vehicle: vehicles[3]._id,
      serviceType: "Engine Overhaul & Oil Filter",
      cost: 15400,
      date: new Date(),
      status: "Active",
    });
    await Maintenance.create({
      vehicle: vehicles[1]._id,
      serviceType: "Brake Pad Replacement",
      cost: 4500,
      date: new Date("2026-06-10"),
      status: "Completed",
    });

    console.log("[SEED] Seeding fuel and expenses...");
    await FuelLog.create({
      vehicle: vehicles[0]._id,
      trip: trips[0]._id,
      date: new Date("2026-06-01"),
      liters: 12,
      fuelCost: 1200,
    });
    await FuelLog.create({
      vehicle: vehicles[1]._id,
      trip: trips[1]._id,
      date: new Date("2026-06-15"),
      liters: 28,
      fuelCost: 2800,
    });

    await Expense.create({
      vehicle: vehicles[0]._id,
      trip: trips[0]._id,
      toll: 150,
      other: 50,
    });
    await Expense.create({
      vehicle: vehicles[1]._id,
      trip: trips[1]._id,
      toll: 320,
      other: 100,
      maintenanceLinked: 4500,
    });

    console.log("[SEED] All data seeded successfully. Closing DB connection.");
    await mongoose.connection.close();
    console.log("[SEED] Done!");
  } catch (err) {
    console.error("[SEED] Error seeding data:", err);
    process.exit(1);
  }
}

seed();
