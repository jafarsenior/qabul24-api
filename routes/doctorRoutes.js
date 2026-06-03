import { Router } from 'express';

import { asyncRoute } from '../middleware/asyncRoute.js';
import { Doctor, User } from '../models/index.js';
import { getAvailableSlots, saveDoctor } from '../services/doctorService.js';
import { cleanDoc } from '../utils/document.js';

const router = Router();

router.get('/', asyncRoute(async (_req, res) => {
  const doctors = await Doctor.find().sort({ name: 1 }).lean();
  res.json(doctors.map(cleanDoc));
}));

router.post('/', asyncRoute(async (req, res) => {
  const doctor = await saveDoctor(req.body);
  res.json(doctor);
}));

router.get('/:id/slots', asyncRoute(async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date query is required' });

  const slots = await getAvailableSlots(req.params.id, date);
  if (slots === null) return res.status(404).json({ message: 'Doctor not found' });
  return res.json(slots);
}));

router.get('/:id', asyncRoute(async (req, res) => {
  const doctor = await Doctor.findOne({ id: req.params.id }).lean();
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  return res.json(cleanDoc(doctor));
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const doctor = await saveDoctor(req.body, req.params.id);
  res.json(doctor);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const doctor = await Doctor.findOneAndDelete({ id: req.params.id }).lean();
  if (doctor) await User.deleteOne({ id: doctor.userId, role: 'doctor' });
  res.json({ success: true });
}));

export default router;
