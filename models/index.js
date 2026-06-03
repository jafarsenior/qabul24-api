import mongoose from 'mongoose';

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

export const User = mongoose.model('User', userSchema);
export const Doctor = mongoose.model('Doctor', doctorSchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);
export const Counter = mongoose.model('Counter', counterSchema);
export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
