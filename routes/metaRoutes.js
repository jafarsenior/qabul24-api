import { Router } from 'express';

import { databaseStatus } from '../config/database.js';

export const rootRouter = Router();
export const metaRouter = Router();

rootRouter.get('/', (_req, res) => {
  res.json({ name: 'MRMS API', status: 'running', baseUrl: '/api', health: '/api/health' });
});

metaRouter.get('/', (_req, res) => {
  res.json({
    name: 'MRMS API',
    database: 'MongoDB',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users/patients',
      'GET /api/doctors',
      'POST /api/doctors',
      'GET /api/doctors/:id',
      'GET /api/doctors/:id/slots?date=YYYY-MM-DD',
      'GET /api/appointments',
      'POST /api/appointments',
      'POST /api/contact-messages',
      'GET /api/contact-messages',
      'GET /api/stats/dashboard',
    ],
  });
});

metaRouter.get('/health', (_req, res) => {
  const database = databaseStatus();
  res.json({ status: database === 'connected' ? 'ok' : 'degraded', database });
});
