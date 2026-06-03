import { Router } from 'express';

import { asyncRoute } from '../middleware/asyncRoute.js';
import { User } from '../models/index.js';
import { toUser } from '../utils/document.js';

const router = Router();

router.get('/patients', asyncRoute(async (_req, res) => {
  const users = await User.find({ role: 'patient' }).sort({ createdAt: -1 });
  res.json(users.map(toUser));
}));

export default router;
