import alumnoRepository from '../repositories/AlumnoRepository.js';
import Alumno from '../models/Alumno.js';
import { BadRequestError, NotFoundError, ConflictError } from '../exceptions/AppError.js';
import { Messages } from '../enums/Mensajes.js';
import { generarId } from '../utils/generadorId.js';

class AlumnoService {
    getAll() {
        return alumnoRepository.findAll();
    }

    getById(id) {
        const alumnoId = Number(id);
        const alumno = alumnoRepository.findById(alumnoId);
        if (!alumno) {
            throw new NotFoundError(Messages.ALUMNO_NOT_FOUND);
        }
        return alumno;
    }

    create(data) {
        const { nombre, apellido, email, telefono, fechaNacimiento, nivel } = data;
        if (!nombre || !apellido || !email) {
            throw new BadRequestError(Messages.INVALID_DATA);
        }
        if (alumnoRepository.existsByEmail(email)) {
            throw new ConflictError(Messages.DUPLICATED_RESOURCE);
        }
        const id = generarId();
        const alumno = new Alumno(id, nombre, apellido, email, telefono, fechaNacimiento, nivel);
        return alumnoRepository.create(alumno);
    }

    update(id, data) {
        const existing = this.getById(id);
        if (data.email && alumnoRepository.existsByEmail(data.email, existing.id)) {
            throw new ConflictError(Messages.DUPLICATED_RESOURCE);
        }
        return alumnoRepository.update(existing.id, data);
    }

    remove(id) {
        const existing = this.getById(id);
        alumnoRepository.delete(existing.id);
    }
}

export default new AlumnoService();
