import mongoose from 'mongoose';

import { mongoUri } from './env.js';

const mongoConnectionStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export function databaseStatus() {
  return mongoConnectionStates[mongoose.connection.readyState] || 'unknown';
}

export async function connectDatabase() {
  return mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
}
