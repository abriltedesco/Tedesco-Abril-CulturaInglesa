import { Router } from 'express';
import alumnoController from '../controllers/AlumnoController.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = Router();

router.use(requireAdmin);

router.get('/', alumnoController.getAll);
router.get('/:id', alumnoController.getById);
router.post('/', alumnoController.create);
router.put('/:id', alumnoController.update);
router.delete('/:id', alumnoController.remove);

export default router;
