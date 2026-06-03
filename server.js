import app from './app.js';
import { connectDatabase } from './config/database.js';
import { isVercel, port } from './config/env.js';

connectDatabase()
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });

if (!isVercel) {
  app.listen(port, () => {
    console.log(`MRMS API listening on http://localhost:${port}`);
  });
}

export default app;
