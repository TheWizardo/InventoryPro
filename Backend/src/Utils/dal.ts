import mongoose from "mongoose";
import config from "./config";

const mongoUri = process.env?.MONGO_URI || "mongodb://localhost:27017/" + process.env?.CLIENT;

/**
 * Connect to MongoDB using Mongoose.
 */
export async function connectToDatabase(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
        console.log("⚡ Using existing MongoDB connection");
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB with Mongoose @ " + mongoUri);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

/**
 * Disconnect from MongoDB.
 */
export async function closeDatabase(): Promise<void> {
    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed");
}
