import { Router } from 'express';
import authController from '../controllers/AuthController.js';

const router = Router();
router.post('/login', authController.login);
// /register eliminado de la capa pública: sólo el admin da de alta usuarios
router.post('/logout', authController.logout);
export default router;
