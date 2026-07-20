import mongoose from 'mongoose';

/**
 * connectDB — Connects to our MongoDB database using Mongoose.
 *
 * Called once when the server starts (in index.js).
 * If the connection fails, the server exits immediately — there's no point
 * running without a database.
 *
 * The MongoDB connection string (MONGO_URI) is stored in the .env file.
 */
export async function connectDB() {
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    const connection = await mongoose.connect(process.env.MONGO_URI);

    // Log the hostname of the MongoDB server we connected to (useful for debugging)
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);

  } catch (error) {
    // Log the specific error message so we know what went wrong
    console.error('❌ MongoDB connection error:', error.message);

    // Exit the process — if DB is down, the backend can't function
    process.exit(1);
  }
}
