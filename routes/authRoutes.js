import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { asyncRoute } from '../middleware/asyncRoute.js';
import { Doctor, User } from '../models/index.js';
import { tokenFor } from '../utils/auth.js';
import { cleanDoc, toUser } from '../utils/document.js';
import { makeId } from '../utils/id.js';
import { now } from '../utils/date.js';

const router = Router();

router.post('/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
  }

  const doctorProfile = user.role === 'doctor' ? cleanDoc(await Doctor.findOne({ userId: user.id })) : null;
  return res.json({ user: toUser(user), doctorProfile, token: tokenFor(user) });
}));

router.post('/register', asyncRoute(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi kerak" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const exists = await User.exists({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "Bu email ro'yxatdan o'tgan" });

  const usersCount = await User.countDocuments();
  const role = usersCount === 0 ? 'admin' : 'patient';
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    id: makeId('u'),
    name,
    email: normalizedEmail,
    phone,
    role,
    passwordHash,
    createdAt: now(),
  });

  return res.status(201).json({ user: toUser(user), doctorProfile: null, token: tokenFor(user) });
}));

export default router;
