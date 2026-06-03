import { Router } from 'express';

import { asyncRoute } from '../middleware/asyncRoute.js';
import { Appointment, Doctor } from '../models/index.js';
import { nextTicketNumber } from '../services/counterService.js';
import { getAvailableSlots } from '../services/doctorService.js';
import { cleanDoc } from '../utils/document.js';
import { makeId } from '../utils/id.js';
import { now } from '../utils/date.js';

const router = Router();

router.get('/', asyncRoute(async (_req, res) => {
  const appointments = await Appointment.find().sort({ date: -1, time: -1 }).lean();
  res.json(appointments.map(cleanDoc));
}));

router.get('/patient/:patientId', asyncRoute(async (req, res) => {
  const appointments = await Appointment.find({ patientId: req.params.patientId }).sort({ date: -1, time: -1 }).lean();
  res.json(appointments.map(cleanDoc));
}));

router.get('/doctor/:doctorId', asyncRoute(async (req, res) => {
  const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ date: -1, time: -1 }).lean();
  res.json(appointments.map(cleanDoc));
}));

router.get('/:id', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOne({ id: req.params.id }).lean();
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.json(cleanDoc(appointment));
}));

router.post('/', asyncRoute(async (req, res) => {
  const doctor = await Doctor.findOne({ id: req.body.doctorId }).lean();
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const slots = await getAvailableSlots(req.body.doctorId, req.body.date);
  if (!slots?.includes(req.body.time)) return res.status(409).json({ message: 'Bu vaqt band yoki mavjud emas' });

  const appointment = await Appointment.create({
    id: makeId('a'),
    ticketNumber: await nextTicketNumber(),
    patientId: req.body.patientId,
    patientName: req.body.patientName,
    patientPhone: req.body.patientPhone,
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpecialty: doctor.specialty,
    roomNumber: doctor.roomNumber,
    date: req.body.date,
    time: req.body.time,
    status: 'pending',
    reason: req.body.reason,
    createdAt: now(),
  });

  res.status(201).json(cleanDoc(appointment));
}));

router.patch('/:id/status', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { id: req.params.id },
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.json(cleanDoc(appointment));
}));

router.patch('/:id/cancel', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { id: req.params.id },
    { status: 'cancelled' },
    { new: true },
  );
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.json(cleanDoc(appointment));
}));

router.post('/:id/diagnosis', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOne({ id: req.params.id });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  appointment.diagnosis = {
    ...req.body,
    id: makeId('diag'),
    appointmentId: appointment.id,
    createdAt: now(),
  };
  appointment.status = 'completed';
  await appointment.save();

  return res.json(cleanDoc(appointment));
}));

export default router;
