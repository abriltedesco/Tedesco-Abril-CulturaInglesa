import AppError from '../exceptions/AppError.js';
import { errorResponse } from '../responses/ApiResponse.js';
import { Messages } from '../enums/Mensajes.js';

export const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return errorResponse(res, err.message, err.statusCode);
    }
    console.error(err);
    return errorResponse(res, Messages.INTERNAL_SERVER_ERROR, 500);
};
