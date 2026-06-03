import { Router } from 'express';

import { asyncRoute } from '../middleware/asyncRoute.js';
import { Appointment, Doctor, User } from '../models/index.js';
import { today } from '../utils/date.js';

const router = Router();

router.get('/dashboard', asyncRoute(async (_req, res) => {
  const [doctors, patients, todayCount, pending] = await Promise.all([
    Doctor.countDocuments(),
    User.countDocuments({ role: 'patient' }),
    Appointment.countDocuments({ date: today() }),
    Appointment.countDocuments({ status: 'pending' }),
  ]);

  res.json({ doctors, patients, today: todayCount, pending });
}));

export default router;
