import crypto from 'node:crypto';
import { errorResponse, successResponse } from '../responses/ApiResponse.js';
import academy from '../repositories/AcademyRepository.js';
import { assertEmail } from '../utils/reglasNegocio.js';

const sessions = new Map();
const adminEmail = process.env.ADMIN_EMAIL || 'admin@culturainglesa.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

class AuthController {
    login = (req, res) => {
        const { email, password } = req.body || {};
        try { assertEmail(email); } catch { return errorResponse(res, 'Credenciales inválidas.', 401); }
        const user = academy.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password);
        if (!user) {
            return errorResponse(res, 'Credenciales inválidas.', 401);
        }

        const token = crypto.randomUUID();
        sessions.set(token, { id: user.id, email: user.email, rol: user.rol });
        return successResponse(res, { token, user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol } });
    };

    logout = (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) sessions.delete(token);
        return successResponse(res, null);
    };
}

export const getSession = (token) => sessions.get(token);
export default new AuthController();
