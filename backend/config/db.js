// backend/config/db.js
// This module handles the connection logic to the MongoDB database using Mongoose.

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    // Disable strict query mode to allow for more flexible queries.
    // This is the default in Mongoose 7, but explicit is better.
    mongoose.set('strictQuery', false);

    // Attempt to connect to the MongoDB instance using the connection string
    // from the environment variables.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
        // Options to avoid deprecation warnings
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If the connection fails, log the error and terminate the application process.
    // A failed database connection is a critical error.
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
