import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse } from '../responses/ApiResponse.js';
import academy, { saveState } from '../repositories/AcademyRepository.js';
import academyService from '../services/AcademyService.js';
import { assertEmail } from '../utils/reglasNegocio.js';

const SALT_ROUNDS = 10;
const sessions = new Map();

/**
 * Hashea la contraseña del admin por defecto al primer arranque
 * si aún no fue hasheada (campo passwordHashed === false).
 */
const migrateAdminPassword = async () => {
    const admin = academy.users.find((u) => u.rol === 'ADMIN');
    if (admin && admin.passwordHashed === false) {
        admin.password = await bcrypt.hash(admin.password, SALT_ROUNDS);
        admin.passwordHashed = true;
        saveState();
    }
};
migrateAdminPassword();

class AuthController {
    login = async (req, res) => {
        const { email, password } = req.body || {};
        try {
            assertEmail(email);
        } catch {
            return errorResponse(res, 'Credenciales inválidas.', 401);
        }

        const user = academy.users.find(
            (candidate) => candidate.email.toLowerCase() === String(email).toLowerCase()
        );
        if (!user) return errorResponse(res, 'Credenciales inválidas.', 401);

        // Soporte para contraseñas hasheadas y texto plano (migración gradual)
        let valid = false;
        if (user.passwordHashed) {
            valid = await bcrypt.compare(String(password), user.password);
        } else {
            valid = user.password === String(password);
            if (valid) {
                // Migrar al primer login exitoso
                user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
                user.passwordHashed = true;
                saveState();
            }
        }

        if (!valid) return errorResponse(res, 'Credenciales inválidas.', 401);

        const token = crypto.randomUUID();
        sessions.set(token, { id: user.id, email: user.email, rol: user.rol });
        return successResponse(res, {
            token,
            user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol }
        });
    };

    logout = (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) sessions.delete(token);
        return successResponse(res, null);
    };
}

export const getSession = (token) => sessions.get(token);
export default new AuthController();
