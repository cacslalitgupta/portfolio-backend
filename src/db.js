import mongoose from "mongoose";
import { seed } from "./seed.js";

export async function connectDb() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ca_firm";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    console.error("\n✖ Could not connect to MongoDB at:", uri.replace(/\/\/.*@/, "//***@"));
    console.error("  " + err.message);
    console.error("\n  Fix: start MongoDB locally (or `docker compose up -d`), or set MONGODB_URI in server/.env");
    console.error("  to a MongoDB Atlas connection string.\n");
    process.exit(1);
  }
  console.log(`MongoDB connected → database "${mongoose.connection.name}"`);
  await seed();
}