import academy, { id, saveState } from '../repositories/AcademyRepository.js';
import { Curso, Inscripcion, Calificacion, Asistencia } from '../models/AcademyModels.js';
import { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js';
import { EstadoInscripcion } from '../enums/EstadoInscripcion.js';
import { assertDni, assertEmail, assertMinimumAge, assertUnique } from '../utils/reglasNegocio.js';

const getUser = (userId) => academy.users.find((user) => user.id === Number(userId));
const getCourse = (courseId) => academy.cursos.find((course) => course.id === Number(courseId));
const getEnrollment = (enrollmentId) => academy.inscripciones.find((item) => item.id === Number(enrollmentId));

class AcademyService {
    getCourseForBirthDate(dateOfBirth) {
        if (!dateOfBirth) return null;
        const dob = new Date(dateOfBirth);
        if (Number.isNaN(dob.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        if (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())) age--;

        let targetName = '';
        if (age >= 4 && age <= 6) targetName = 'Inicial 1';
        else if (age >= 7 && age <= 10) targetName = 'Inicial 2';
        else if (age >= 11 && age <= 13) targetName = 'Adolescentes 1';
        else if (age >= 14 && age <= 17) targetName = 'Adolescentes 2';
        else if (age >= 18 && age <= 30) targetName = 'Adultos 1';
        else if (age > 30) targetName = 'Adultos 2';
        else return null;

        return academy.cursos.find((c) => c.name.toLowerCase() === targetName.toLowerCase()) || null;
    }

    registerUser(data, rol) {
        let { nombre, apellido, email, dni, fechaNacimiento, cursoId, telefono } = data;
        nombre = String(nombre || '').trim();
        apellido = String(apellido || '').trim();
        email = String(email || '').trim().toLowerCase();
        dni = String(dni || '').replace(/\D/g, '');
        telefono = String(telefono || '').trim();

        if (!nombre || !apellido || !email || !dni || (rol === 'ALUMNO' && !fechaNacimiento)) {
            throw new BadRequestError('Faltan datos obligatorios del usuario.');
        }

        assertEmail(email);
        assertDni(dni);

        if (rol === 'ALUMNO') {
            assertMinimumAge(fechaNacimiento);
            const autoCourse = this.getCourseForBirthDate(fechaNacimiento);
            if (autoCourse && (!cursoId || !getCourse(cursoId))) {
                cursoId = autoCourse.id;
            }
        }

        if (!cursoId) {
            throw new BadRequestError('Debe seleccionar un curso.');
        }
        const course = getCourse(cursoId);
        if (!course) throw new NotFoundError('El curso seleccionado no existe.');

        assertUnique(academy.users, 'email', email, 'El email ya está registrado.');
        assertUnique(academy.users, 'dni', dni, 'El DNI ya está registrado.');

        const user = {
            id: id(),
            nombre,
            apellido,
            email,
            dni: String(dni),
            telefono,
            fechaNacimiento: fechaNacimiento || undefined,
            rol,
            password: data.password || email,
            estado: 'ACTIVO',
            estadoCobro: 'NO COBRADO'
        };

        academy.users.push(user);
        if (rol === 'ALUMNO') {
            this.enroll(user.id, course.id);
        } else {
            this.assignTeacher(course.id, user.id);
        }

        saveState();
        return { ...user, password: undefined };
    }

    updateUser(userId, data) {
        const user = getUser(userId);
        if (!user) throw new NotFoundError('Usuario no encontrado.');

        let { nombre, apellido, email, dni, fechaNacimiento, telefono, cursoId } = data;
        nombre = String(nombre || '').trim();
        apellido = String(apellido || '').trim();
        email = String(email || '').trim().toLowerCase();
        dni = String(dni || '').replace(/\D/g, '');
        telefono = String(telefono || '').trim();

        if (!nombre || !apellido || !email || !dni || !cursoId) {
            throw new BadRequestError('Faltan datos obligatorios, incluido el curso.');
        }
        assertEmail(email);
        assertDni(dni);

        const course = getCourse(cursoId);
        if (!course) throw new NotFoundError('El curso seleccionado no existe.');

        if (academy.users.some((item) => item.id !== user.id && (item.email === email || item.dni === String(dni)))) {
            throw new ConflictError('El email o DNI ya está registrado.');
        }

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

        saveState();
        const { password, ...safeUser } = user;
        return safeUser;
    }

    deleteUser(userId) {
        const idNum = Number(userId);
        const index = academy.users.findIndex((u) => u.id === idNum);
        if (index === -1) throw new NotFoundError('Usuario no encontrado.');
        const user = academy.users[index];
        if (user.rol === 'ADMIN') throw new BadRequestError('No se puede eliminar el usuario administrador.');

        academy.users.splice(index, 1);
        academy.inscripciones = academy.inscripciones.filter((i) => i.alumnoId !== idNum);
        academy.cursos.forEach((c) => {
            if (c.teacherId === idNum) c.teacherId = undefined;
        });

        saveState();
        return { success: true };
    }

    changePassword(userId, currentPassword, newPassword) {
        const user = getUser(userId);
        if (!user || user.password !== currentPassword || !newPassword) throw new BadRequestError('No se pudo cambiar la contraseña.');
        user.password = newPassword;
        saveState();
        return { success: true };
    }

    createCourse(data) {
        if (!data.name || !data.level || !Number.isInteger(data.capacity) || data.capacity <= 0 || !data.schedule) throw new BadRequestError('Datos de curso inválidos.');
        const course = new Curso(id(), data);
        academy.cursos.push(course);
        saveState();
        return course;
    }

    assignTeacher(courseId, teacherId) {
        const course = getCourse(courseId);
        const teacher = getUser(teacherId);
        if (!course || !teacher) throw new NotFoundError('Curso o profesor no encontrado.');
        if (teacher.rol !== 'PROFESOR') throw new BadRequestError('El usuario no es profesor.');
        course.teacherId = teacher.id;
        saveState();
        return course;
    }

    enroll(studentId, courseId) {
        const student = getUser(studentId);
        const course = getCourse(courseId);
        if (!student || student.rol !== 'ALUMNO' || !course) throw new NotFoundError('Alumno o curso no encontrado.');
        const confirmed = academy.inscripciones.filter((item) => item.cursoId === course.id && [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA, EstadoInscripcion.EN_CURSO].includes(item.estado));
        if (confirmed.length >= course.capacity) throw new ConflictError('El curso alcanzó su capacidad máxima.');
        if (academy.inscripciones.some((item) => item.alumnoId === student.id && item.cursoId === course.id && item.estado !== EstadoInscripcion.CANCELADA)) {
            // Already enrolled
            return academy.inscripciones.find((item) => item.alumnoId === student.id && item.cursoId === course.id);
        }
        if (course.prerequisiteLevel && !academy.inscripciones.some((item) => item.alumnoId === student.id && item.level === course.prerequisiteLevel && item.estado === EstadoInscripcion.FINALIZADA && item.passed)) throw new ConflictError('El alumno no aprobó el nivel previo requerido.');
        const enrollment = new Inscripcion(id(), student.id, course.id);
        enrollment.level = course.level;
        academy.inscripciones.push(enrollment);
        saveState();
        return enrollment;
    }

    recordGrade(enrollmentId, teacher, value, period, metadata = {}) {
        const enrollment = getEnrollment(enrollmentId);
        const course = enrollment && getCourse(enrollment.cursoId);
        if (!enrollment || !course) throw new NotFoundError('Inscripción no encontrada.');
        if (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id) throw new BadRequestError('El profesor no está asignado a este curso.');
        if (typeof value !== 'number' || value < 0 || value > 10) throw new BadRequestError('La calificación debe estar entre 0 y 10.');
        const grade = new Calificacion(id(), enrollment.id, teacher.id, value, period, metadata);
        academy.calificaciones.push(grade);
        saveState();
        return grade;
    }

    recordAttendance(enrollmentId, teacher, date, present) {
        const enrollment = getEnrollment(enrollmentId);
        const course = enrollment && getCourse(enrollment.cursoId);
        if (!enrollment || !course) throw new NotFoundError('Inscripción no encontrada.');
        if (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id) throw new BadRequestError('El profesor no está asignado a este curso.');
        const attendance = new Asistencia(id(), enrollment.id, teacher.id, date, Boolean(present));
        academy.asistencias.push(attendance);
        saveState();
        return attendance;
    }

    payEnrollment(enrollmentId, amount, method) {
        const enrollment = getEnrollment(enrollmentId);
        if (!enrollment || !amount || !method) throw new BadRequestError('Datos de pago inválidos.');
        const payment = { id: id(), enrollmentId: enrollment.id, amount, method, status: 'PAGADO', date: new Date().toISOString() };
        academy.pagos.push(payment);
        enrollment.estado = EstadoInscripcion.CONFIRMADA;
        saveState();
        return payment;
    }

    updateEnrollmentState(enrollmentId, state) {
        const enrollment = getEnrollment(enrollmentId);
        if (!enrollment || !Object.values(EstadoInscripcion).includes(state)) throw new BadRequestError('Estado de inscripción inválido.');
        enrollment.estado = state;
        saveState();
        return enrollment;
    }

    announce(teacher, courseId, message) {
        const course = getCourse(courseId);
        if (!course || (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id)) throw new BadRequestError('El profesor no está asignado a este curso.');
        if (!message) throw new BadRequestError('El anuncio no puede estar vacío.');
        const announcement = { id: id(), courseId: course.id, teacherId: teacher.id, message, date: new Date().toISOString() };
        academy.anuncios.push(announcement);
        saveState();
        return announcement;
    }
}

export default new AcademyService();
