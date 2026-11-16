import { Router } from 'express';
import contactoController from '../controllers/ContactoController.js';

const router = Router();

// Endpoint público
router.post('/', contactoController.enviar);

export default router;
