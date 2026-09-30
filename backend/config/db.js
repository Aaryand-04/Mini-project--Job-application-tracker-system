const mongoose = require('mongoose');

let mongodInstance = null;

/**
 * Connect to MongoDB database using MONGODB_URI environment variable,
 * with automatic in-memory fallback in development if local daemon is not running.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // Try direct connection first
  if (uri) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (directErr) {
      console.warn(`⚠️ Direct MongoDB connection to ${uri} failed: ${directErr.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw directErr;
      }
    }
  }

  // Development fallback: spin up MongoMemoryServer
  try {
    console.log('🔄 Initializing in-memory MongoDB engine for local development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`✅ In-Memory MongoDB Connected at: ${memUri}`);
    return conn;
  } catch (memErr) {
    console.error(`❌ Failed to initialize in-memory database: ${memErr.message}`);
    throw memErr;
  }
};

/**
 * Close MongoDB connection and stop in-memory server if active
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

module.exports = { connectDB, closeDB };
