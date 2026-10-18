import { errorResponse } from '../responses/ApiResponse.js';

export const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) return errorResponse(res, 'No tienes permisos para realizar esta acción.', 403);
    next();
};
