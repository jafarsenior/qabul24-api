import bcrypt from 'bcryptjs';

import { defaultDoctorPassword } from '../config/env.js';
import { Appointment, Doctor, User } from '../models/index.js';
import { cleanDoc } from '../utils/document.js';
import { makeId } from '../utils/id.js';
import { now } from '../utils/date.js';

export function defaultSchedule() {
  return [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
    { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', slotDurationMinutes: 30 },
  ];
}

export async function getAvailableSlots(doctorId, date) {
  const doctor = await Doctor.findOne({ id: doctorId }).lean();
  if (!doctor) return null;

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const schedule = doctor.schedule.find((item) => item.dayOfWeek === dayOfWeek);
  if (!schedule) return [];

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const end = endH * 60 + endM;
  const appointments = await Appointment.find({
    doctorId,
    date,
    status: { $ne: 'cancelled' },
  }).select('time').lean();
  const bookedTimes = new Set(appointments.map((appointment) => appointment.time));
  const slots = [];

  for (let current = startH * 60 + startM; current + schedule.slotDurationMinutes <= end; current += schedule.slotDurationMinutes) {
    const time = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    if (!bookedTimes.has(time)) slots.push(time);
  }

  return slots;
}

export async function saveDoctor(body, idFromRoute) {
  const existingDoctor = await Doctor.findOne({ id: idFromRoute || body.id });
  const doctorId = idFromRoute || body.id || makeId('d');
  const userId = existingDoctor?.userId || body.userId || makeId('u');
  const email = String(body.email || '').toLowerCase().trim();
  const schedule = Array.isArray(body.schedule) && body.schedule.length ? body.schedule : defaultSchedule();
  const password = String(body.password || '');

  if (!existingDoctor && password.length < 6) {
    const error = new Error('Shifokor paroli kamida 6 belgi bo\'lishi kerak');
    error.statusCode = 400;
    throw error;
  }

  const doctorPayload = {
    id: doctorId,
    userId,
    name: body.name,
    email,
    phone: body.phone,
    specialty: body.specialty,
    department: body.department,
    experience: Number(body.experience || 0),
    rating: Number(body.rating || 4.5),
    photoUrl: body.photoUrl,
    roomNumber: body.roomNumber,
    schedule,
  };

  const userSet = {
    id: userId,
    name: doctorPayload.name,
    email: doctorPayload.email,
    phone: doctorPayload.phone,
    role: 'doctor',
  };

  if (password) {
    userSet.passwordHash = await bcrypt.hash(password, 10);
  }

  const updateUser = {
    $set: userSet,
    $setOnInsert: { createdAt: now() },
  };

  if (!password) {
    updateUser.$setOnInsert.passwordHash = await bcrypt.hash(defaultDoctorPassword, 10);
  }

  await User.findOneAndUpdate(
    { id: userId },
    updateUser,
    { upsert: true, runValidators: true },
  );

  const doctor = await Doctor.findOneAndUpdate(
    { id: doctorId },
    doctorPayload,
    { new: true, upsert: true, runValidators: true },
  );

  return cleanDoc(doctor);
}
