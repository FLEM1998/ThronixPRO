import { db } from "./db";
import { users, tradingBots, positions } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  console.log("Initializing database...");

  try {
    // Check if demo user already exists
    const existingUser = await db.select().from(users).limit(1);
    if (existingUser.length > 0) {
      console.log("Database already has users, skipping initialization");
      return;
    }

    // No demo users - production platform requires real user registration
    console.log("Database initialization completed - ready for real user registration");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };