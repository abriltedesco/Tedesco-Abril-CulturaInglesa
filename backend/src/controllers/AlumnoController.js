import alumnoService from '../services/AlumnoService.js';
import { successResponse } from '../responses/ApiResponse.js';

class AlumnoController {
    getAll = (req, res, next) => {
        try {
            const alumnos = alumnoService.getAll();
            return successResponse(res, alumnos);
        } catch (err) {
            next(err);
        }
    };

    getById = (req, res, next) => {
        try {
            const alumno = alumnoService.getById(req.params.id);
            return successResponse(res, alumno);
        } catch (err) {
            next(err);
        }
    };

    create = (req, res, next) => {
        try {
            const alumno = alumnoService.create(req.body);
            return successResponse(res, alumno, 201);
        } catch (err) {
            next(err);
        }
    };

    update = (req, res, next) => {
        try {
            const alumno = alumnoService.update(req.params.id, req.body);
            return successResponse(res, alumno);
        } catch (err) {
            next(err);
        }
    };

    remove = (req, res, next) => {
        try {
            alumnoService.remove(req.params.id);
            return successResponse(res, null);
        } catch (err) {
            next(err);
        }
    };
}

export default new AlumnoController();
