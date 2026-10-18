import { errorResponse } from '../responses/ApiResponse.js';
import { getSession } from '../controllers/AuthController.js';

export const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = token ? getSession(token) : null;

    if (!session) {
        return errorResponse(res, 'Acceso no autorizado.', 401);
    }

    req.user = session;
    next();
};

export const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.rol !== 'ADMIN') return errorResponse(res, 'Acceso no autorizado.', 403);
        next();
    });
};
