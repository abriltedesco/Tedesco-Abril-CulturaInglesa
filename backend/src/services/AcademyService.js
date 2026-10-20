import academy, { id } from '../repositories/AcademyRepository.js';
import { Curso, Inscripcion, Calificacion, Asistencia } from '../models/AcademyModels.js';
import { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js';
import { EstadoInscripcion } from '../enums/EstadoInscripcion.js';
import { assertDni, assertEmail, assertMinimumAge, assertUnique, overlaps } from '../utils/reglasNegocio.js';

const getUser = (userId) => academy.users.find((user) => user.id === Number(userId));
const getCourse = (courseId) => academy.cursos.find((course) => course.id === Number(courseId));
const getEnrollment = (enrollmentId) => academy.inscripciones.find((item) => item.id === Number(enrollmentId));

class AcademyService {
    registerUser(data, rol) {
        const { nombre, apellido, email, dni, fechaNacimiento, cursoId } = data;
        if (!nombre || !apellido || !email || !dni || (rol === 'ALUMNO' && !fechaNacimiento)) throw new BadRequestError('Faltan datos obligatorios del usuario.');
        if (!cursoId) throw new BadRequestError('Debe seleccionar un curso.');
        const course = getCourse(cursoId);
        if (!course) throw new NotFoundError('El curso seleccionado no existe.');
        assertEmail(email); assertDni(dni);
        if (rol === 'ALUMNO') assertMinimumAge(fechaNacimiento);
        assertUnique(academy.users, 'email', email, 'El email ya está registrado.');
        assertUnique(academy.users, 'dni', dni, 'El DNI ya está registrado.');
        const user = { id: id(), nombre, apellido, email, dni: String(dni), fechaNacimiento, rol, password: email, estado: 'ACTIVO', estadoCobro: 'NO COBRADO' };
        academy.users.push(user);
        if (rol === 'ALUMNO') this.enroll(user.id, course.id);
        else this.assignTeacher(course.id, user.id);
        return { ...user, password: undefined };
    }

    updateUser(userId, data) {
        const user = getUser(userId);
        if (!user) throw new NotFoundError('Usuario no encontrado.');
        const { nombre, apellido, email, dni, fechaNacimiento, telefono, cursoId } = data;
        if (!nombre || !apellido || !email || !dni || !cursoId) throw new BadRequestError('Faltan datos obligatorios, incluido el curso.');
        const course = getCourse(cursoId);
        if (!course) throw new NotFoundError('El curso seleccionado no existe.');
        if (academy.users.some((item) => item.id !== user.id && (item.email === email || item.dni === String(dni)))) throw new ConflictError('El email o DNI ya está registrado.');
        Object.assign(user, { nombre, apellido, email, dni: String(dni), fechaNacimiento, telefono });
        if (user.rol === 'ALUMNO') {
            const current = academy.inscripciones.find((item) => item.alumnoId === user.id && item.estado !== EstadoInscripcion.CANCELADA);
            if (!current || current.cursoId !== course.id) {
                if (current) current.estado = EstadoInscripcion.CANCELADA;
                this.enroll(user.id, course.id);
            }
        } else {
            const current = academy.cursos.find((item) => item.teacherId === user.id);
            if (current && current.id !== course.id) current.teacherId = undefined;
            this.assignTeacher(course.id, user.id);
        }
        const { password, ...safeUser } = user;
        return safeUser;
    }

    changePassword(userId, currentPassword, newPassword) {
        const user = getUser(userId);
        if (!user || user.password !== currentPassword || !newPassword) throw new BadRequestError('No se pudo cambiar la contraseña.');
        user.password = newPassword;
        return { success: true };
    }

    createCourse(data) {
        if (!data.name || !data.level || !Number.isInteger(data.capacity) || data.capacity <= 0 || !data.schedule) throw new BadRequestError('Datos de curso inválidos.');
        const course = new Curso(id(), data);
        academy.cursos.push(course); return course;
    }

    assignTeacher(courseId, teacherId) {
        const course = getCourse(courseId); const teacher = getUser(teacherId);
        if (!course || !teacher) throw new NotFoundError('Curso o profesor no encontrado.');
        if (teacher.rol !== 'PROFESOR') throw new BadRequestError('El usuario no es profesor.');
        const hasOverlap = academy.cursos.some((item) => item.teacherId === teacher.id && item.id !== course.id && overlaps(item.schedule, course.schedule));
        if (hasOverlap) throw new ConflictError('El profesor ya tiene un curso en ese horario.');
        course.teacherId = teacher.id; return course;
    }

    enroll(studentId, courseId) {
        const student = getUser(studentId); const course = getCourse(courseId);
        if (!student || student.rol !== 'ALUMNO' || !course) throw new NotFoundError('Alumno o curso no encontrado.');
        const confirmed = academy.inscripciones.filter((item) => item.cursoId === course.id && [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA, EstadoInscripcion.EN_CURSO].includes(item.estado));
        if (confirmed.length >= course.capacity) throw new ConflictError('El curso alcanzó su capacidad máxima.');
        if (academy.inscripciones.some((item) => item.alumnoId === student.id && item.cursoId === course.id && item.estado !== EstadoInscripcion.CANCELADA)) throw new ConflictError('El alumno ya está inscripto en el curso.');
        if (course.prerequisiteLevel && !academy.inscripciones.some((item) => item.alumnoId === student.id && item.level === course.prerequisiteLevel && item.estado === EstadoInscripcion.FINALIZADA && item.passed)) throw new ConflictError('El alumno no aprobó el nivel previo requerido.');
        const enrollment = new Inscripcion(id(), student.id, course.id); enrollment.level = course.level;
        academy.inscripciones.push(enrollment); return enrollment;
    }

    recordGrade(enrollmentId, teacher, value, period, metadata = {}) {
        const enrollment = getEnrollment(enrollmentId); const course = enrollment && getCourse(enrollment.cursoId);
        if (!enrollment || !course) throw new NotFoundError('Inscripción no encontrada.');
        if (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id) throw new BadRequestError('El profesor no está asignado a este curso.');
        if (typeof value !== 'number' || value < 0 || value > 10) throw new BadRequestError('La calificación debe estar entre 0 y 10.');
        const grade = new Calificacion(id(), enrollment.id, teacher.id, value, period, metadata); academy.calificaciones.push(grade); return grade;
    }

    recordAttendance(enrollmentId, teacher, date, present) {
        const enrollment = getEnrollment(enrollmentId); const course = enrollment && getCourse(enrollment.cursoId);
        if (!enrollment || !course) throw new NotFoundError('Inscripción no encontrada.');
        if (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id) throw new BadRequestError('El profesor no está asignado a este curso.');
        const attendance = new Asistencia(id(), enrollment.id, teacher.id, date, Boolean(present)); academy.asistencias.push(attendance); return attendance;
    }

    payEnrollment(enrollmentId, amount, method) {
        const enrollment = getEnrollment(enrollmentId);
        if (!enrollment || !amount || !method) throw new BadRequestError('Datos de pago inválidos.');
        const payment = { id: id(), enrollmentId: enrollment.id, amount, method, status: 'PAGADO', date: new Date().toISOString() };
        academy.pagos.push(payment); enrollment.estado = EstadoInscripcion.CONFIRMADA; return payment;
    }

    updateEnrollmentState(enrollmentId, state) {
        const enrollment = getEnrollment(enrollmentId);
        if (!enrollment || !Object.values(EstadoInscripcion).includes(state)) throw new BadRequestError('Estado de inscripción inválido.');
        enrollment.estado = state; return enrollment;
    }

    announce(teacher, courseId, message) {
        const course = getCourse(courseId);
        if (!course || (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id)) throw new BadRequestError('El profesor no está asignado a este curso.');
        if (!message) throw new BadRequestError('El anuncio no puede estar vacío.');
        const announcement = { id: id(), courseId: course.id, teacherId: teacher.id, message, date: new Date().toISOString() };
        academy.anuncios.push(announcement); return announcement;
    }
}

export default new AcademyService();
