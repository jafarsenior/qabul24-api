import mongoose from 'mongoose';

import { databaseStatus } from '../config/database.js';

export function databaseReady(_req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message: 'Database not connected. Check MONGODB_URI in the server environment variables.',
    database: databaseStatus(),
  });
}
