import { Router } from 'express';

import { databaseReady } from '../middleware/databaseReady.js';
import { metaRouter } from './metaRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import authRoutes from './authRoutes.js';
import contactRoutes from './contactRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import statsRoutes from './statsRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use(metaRouter);
router.use(databaseReady);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/contact-messages', contactRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/stats', statsRoutes);

export default router;
