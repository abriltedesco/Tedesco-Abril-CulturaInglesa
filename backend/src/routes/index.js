import { Router } from 'express';
import alumnoRoutes from './alumnoRoutes.js';

const router = Router();

router.use('/alumnos', alumnoRoutes);

export default router;
