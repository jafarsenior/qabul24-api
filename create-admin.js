import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const [, , emailArg, passwordArg, nameArg, phoneArg] = process.argv;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mrms';

if (!emailArg || !passwordArg) {
  console.error('Usage: npm run admin:create -- admin@example.com admin123 "Admin User" "+998901234567"');
  process.exit(1);
}

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

const User = mongoose.model('User', userSchema);

function makeId() {
  return `u${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

await mongoose.connect(mongoUri);

const email = emailArg.toLowerCase().trim();
const passwordHash = await bcrypt.hash(passwordArg, 10);
const user = await User.findOneAndUpdate(
  { email },
  {
    $set: {
      name: nameArg || 'Admin User',
      phone: phoneArg || '+998000000000',
      role: 'admin',
      passwordHash,
    },
    $setOnInsert: {
      id: makeId(),
      email,
      createdAt: new Date().toISOString(),
    },
  },
  { new: true, upsert: true, runValidators: true },
);

console.log(`Admin ready: ${user.email}`);
await mongoose.disconnect();
