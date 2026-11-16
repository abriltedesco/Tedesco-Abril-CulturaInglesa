import { Router } from 'express';
import niveladorController from '../controllers/NiveladorController.js';

const router = Router();

// Endpoints públicos (sin autenticación)
router.get('/preguntas', niveladorController.getPreguntas);
router.post('/evaluar', niveladorController.evaluar);

export default router;
