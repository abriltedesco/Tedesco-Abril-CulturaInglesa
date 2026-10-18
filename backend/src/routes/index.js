import { Router } from 'express';
import alumnoRoutes from './alumnoRoutes.js';
import authRoutes from './authRoutes.js';
import academyRoutes from './academyRoutes.js';

const router = Router();

router.use('/alumnos', alumnoRoutes);
router.use('/auth', authRoutes);
router.use('/academy', academyRoutes);

export default router;
