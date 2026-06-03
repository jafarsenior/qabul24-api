import cors from 'cors';
import express from 'express';

import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { rootRouter } from './routes/metaRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(rootRouter);
app.use('/api', apiRoutes);
app.use('/api', apiNotFound);
app.use(errorHandler);

export default app;
