import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mrms';

await mongoose.connect(mongoUri);

const collections = await mongoose.connection.db.collections();
for (const collection of collections) {
  await collection.deleteMany({});
}

console.log(`Database cleared: ${mongoose.connection.name}`);
await mongoose.disconnect();
