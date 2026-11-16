import { Router } from 'express';
import alumnoRoutes from './alumnoRoutes.js';
import authRoutes from './authRoutes.js';
import academyRoutes from './academyRoutes.js';
import contactoRoutes from './contactoRoutes.js';
import niveladorRoutes from './niveladorRoutes.js';

const router = Router();

router.use('/alumnos', alumnoRoutes);
router.use('/auth', authRoutes);
router.use('/academy', academyRoutes);
router.use('/contacto', contactoRoutes);
router.use('/nivelador', niveladorRoutes);

export default router;
