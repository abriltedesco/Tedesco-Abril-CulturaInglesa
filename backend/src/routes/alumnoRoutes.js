import { Router } from 'express';
import alumnoController from '../controllers/AlumnoController.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = Router();

// Endpoint de creación público (para formulario de contacto/inscripción)
router.post('/', alumnoController.create);

// Endpoints administrativos protegidos
router.get('/', requireAdmin, alumnoController.getAll);
router.get('/:id', requireAdmin, alumnoController.getById);
router.put('/:id', requireAdmin, alumnoController.update);
router.delete('/:id', requireAdmin, alumnoController.remove);

export default router;
