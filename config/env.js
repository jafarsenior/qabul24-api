import dotenv from 'dotenv';

dotenv.config();

export const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mrms';
export const jwtSecret = process.env.JWT_SECRET || 'mrms-dev-secret';
export const defaultDoctorPassword = process.env.DEFAULT_DOCTOR_PASSWORD || 'doctor123';
export const port = process.env.PORT || 4000;
export const isVercel = Boolean(process.env.VERCEL);
