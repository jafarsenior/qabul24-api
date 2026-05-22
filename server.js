import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mrms';
const jwtSecret = process.env.JWT_SECRET || 'mrms-dev-secret';
const defaultDoctorPassword = process.env.DEFAULT_DOCTOR_PASSWORD || 'doctor123';

app.use(cors());
app.use(express.json());

const scheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, required: true, enum: [15, 20, 30] },
  },
  { _id: false },
);

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  },
  { _id: false },
);

const diagnosisSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    icdCode: { type: String, required: true },
    diseaseName: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, required: true, enum: ['mild', 'moderate', 'severe'] },
    medications: { type: [medicationSchema], default: [] },
    recommendations: { type: String, required: true },
    nextVisitDate: String,
    createdAt: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'doctor', 'patient'] },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const doctorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    specialty: { type: String, required: true },
    department: { type: String, required: true },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    photoUrl: String,
    roomNumber: { type: String, required: true },
    schedule: { type: [scheduleSchema], default: [] },
  },
  { versionKey: false },
);

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    ticketNumber: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorSpecialty: { type: String, required: true },
    roomNumber: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] },
    reason: String,
    diagnosis: diagnosisSchema,
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

const contactMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    message: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Counter = mongoose.model('Counter', counterSchema);
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

function now() {
  return new Date().toISOString();
}

function today() {
  return now().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function nextCounter(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  ).lean();

  return counter.value;
}

async function nextTicketNumber() {
  const value = await nextCounter('ticket');
  return `TKT-${new Date().getFullYear()}-${String(value).padStart(4, '0')}`;
}

function toUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function cleanDoc(doc) {
  if (!doc) return null;
  const value = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  delete value._id;
  return value;
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function defaultSchedule() {
  return [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
    { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', slotDurationMinutes: 30 },
  ];
}

async function getAvailableSlots(doctorId, date) {
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

async function saveDoctor(body, idFromRoute) {
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

app.get('/', (_req, res) => {
  res.json({ name: 'MRMS API', status: 'running', baseUrl: '/api', health: '/api/health' });
});

app.get('/api', (_req, res) => {
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/contact-messages', asyncRoute(async (req, res) => {
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

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
  }

  const doctorProfile = user.role === 'doctor' ? cleanDoc(await Doctor.findOne({ userId: user.id })) : null;
  return res.json({ user: toUser(user), doctorProfile, token: tokenFor(user) });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
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

app.get('/api/users/patients', asyncRoute(async (_req, res) => {
  const users = await User.find({ role: 'patient' }).sort({ createdAt: -1 });
  res.json(users.map(toUser));
}));

app.get('/api/contact-messages', asyncRoute(async (_req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  res.json(messages.map(cleanDoc));
}));

app.get('/api/doctors', asyncRoute(async (_req, res) => {
  const doctors = await Doctor.find().sort({ name: 1 }).lean();
  res.json(doctors.map(cleanDoc));
}));

app.post('/api/doctors', asyncRoute(async (req, res) => {
  const doctor = await saveDoctor(req.body);
  res.json(doctor);
}));

app.get('/api/doctors/:id/slots', asyncRoute(async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date query is required' });

  const slots = await getAvailableSlots(req.params.id, date);
  if (slots === null) return res.status(404).json({ message: 'Doctor not found' });
  return res.json(slots);
}));

app.get('/api/doctors/:id', asyncRoute(async (req, res) => {
  const doctor = await Doctor.findOne({ id: req.params.id }).lean();
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  return res.json(cleanDoc(doctor));
}));

app.put('/api/doctors/:id', asyncRoute(async (req, res) => {
  const doctor = await saveDoctor(req.body, req.params.id);
  res.json(doctor);
}));

app.delete('/api/doctors/:id', asyncRoute(async (req, res) => {
  const doctor = await Doctor.findOneAndDelete({ id: req.params.id }).lean();
  if (doctor) await User.deleteOne({ id: doctor.userId, role: 'doctor' });
  res.json({ success: true });
}));

app.get('/api/appointments', asyncRoute(async (_req, res) => {
  const appointments = await Appointment.find().sort({ date: -1, time: -1 }).lean();
  res.json(appointments.map(cleanDoc));
}));

app.get('/api/appointments/patient/:patientId', asyncRoute(async (req, res) => {
  const appointments = await Appointment.find({ patientId: req.params.patientId }).sort({ date: -1, time: -1 }).lean();
  res.json(appointments.map(cleanDoc));
}));

app.get('/api/appointments/doctor/:doctorId', asyncRoute(async (req, res) => {
  const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ date: -1, time: -1 }).lean();
  res.json(appointments.map(cleanDoc));
}));

app.get('/api/appointments/:id', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOne({ id: req.params.id }).lean();
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.json(cleanDoc(appointment));
}));

app.post('/api/appointments', asyncRoute(async (req, res) => {
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

app.patch('/api/appointments/:id/status', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { id: req.params.id },
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.json(cleanDoc(appointment));
}));

app.patch('/api/appointments/:id/cancel', asyncRoute(async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { id: req.params.id },
    { status: 'cancelled' },
    { new: true },
  );
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.json(cleanDoc(appointment));
}));

app.post('/api/appointments/:id/diagnosis', asyncRoute(async (req, res) => {
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

app.get('/api/stats/dashboard', asyncRoute(async (_req, res) => {
  const [doctors, patients, todayCount, pending] = await Promise.all([
    Doctor.countDocuments(),
    User.countDocuments({ role: 'patient' }),
    Appointment.countDocuments({ date: today() }),
    Appointment.countDocuments({ status: 'pending' }),
  ]);

  res.json({ doctors, patients, today: todayCount, pending });
}));

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use((error, _req, res, _next) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Bu maʼlumot allaqachon mavjud' });
  }

  return res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`MRMS API server running on http://localhost:${port}`);
      console.log(`MongoDB connected: ${mongoUri}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
