import { Router } from 'express';

import { asyncRoute } from '../middleware/asyncRoute.js';
import { ContactMessage } from '../models/index.js';
import { cleanDoc } from '../utils/document.js';
import { makeId } from '../utils/id.js';
import { now } from '../utils/date.js';

const router = Router();

router.post('/', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').toLowerCase().trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi kerak" });
  }

  const contactMessage = await ContactMessage.create({
    id: makeId('msg'),
    name,
    email,
    message,
    createdAt: now(),
  });

  return res.status(201).json(cleanDoc(contactMessage));
}));

router.get('/', asyncRoute(async (_req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  res.json(messages.map(cleanDoc));
}));

export default router;
