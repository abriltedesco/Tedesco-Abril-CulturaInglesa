import bcrypt from 'bcryptjs';
import academy, { id, saveState } from '../repositories/AcademyRepository.js';
import { Curso, Inscripcion, Calificacion, Asistencia } from '../models/AcademyModels.js';
import { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js';
import { EstadoInscripcion } from '../enums/EstadoInscripcion.js';
import { assertDni, assertEmail, assertMinimumAge, assertUnique, overlaps } from '../utils/reglasNegocio.js';

const SALT_ROUNDS = 10;
const ACTIVE_STATES = [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA, EstadoInscripcion.EN_CURSO];
const MIN_ATTENDANCE_PCT = 70;
const todayISO = () => new Date().toISOString().slice(0, 10);
const shiftYear = (isoDate, years) => {
    const [y, ...rest] = String(isoDate).split('-');
    return [String(Number(y) + years), ...rest].join('-');
};

// Asistencia sobre el total de clases programadas del ciclo
const computeAttendance = (enrollment, course) => {
    const total = Number(course?.totalClases) || 25;
    const records = academy.asistencias.filter((a) => a.inscripcionId === enrollment.id);
    const presentes = records.filter((a) => a.present).length;
    const ausentes = records.length - presentes;
    const porcentaje = Math.round((presentes / total) * 100);
    // Con estas faltas ya es imposible alcanzar el mínimo exigido
    const maxPosible = ((total - ausentes) / total) * 100;
    return { total, presentes, ausentes, porcentaje, desaprobadoPorFaltas: maxPosible < MIN_ATTENDANCE_PCT };
};
const getUser = (userId) => academy.users.find((user) => user.id === Number(userId));
const getCourse = (courseId) => academy.cursos.find((course) => course.id === Number(courseId));
const getEnrollment = (enrollmentId) => academy.inscripciones.find((item) => item.id === Number(enrollmentId));

class AcademyService {
    refreshAttendance(enrollment) {
        const course = getCourse(enrollment.cursoId);
        const stats = computeAttendance(enrollment, course);
        enrollment.porcentajeAsistencia = stats.porcentaje;
        enrollment.asistenciasPresentes = stats.presentes;
        enrollment.ausencias = stats.ausentes;
        enrollment.totalClasesCiclo = stats.total;
        enrollment.desaprobadoPorFaltas = stats.desaprobadoPorFaltas;
        if (stats.desaprobadoPorFaltas && enrollment.estado !== EstadoInscripcion.CANCELADA) {
            enrollment.passed = false;
        }
        return stats;
    }

    // Finaliza automáticamente los ciclos cuya fecha de fin ya pasó
    syncAcademicCycles() {
        const today = todayISO();
        academy.cursos
            .filter((c) => !c.cicloFinalizado && c.fechaFin && c.fechaFin < today)
            .forEach((c) => this.finishAcademicCycle(c.id));
        academy.inscripciones.forEach((ins) => this.refreshAttendance(ins));
    }

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
        let { nombre, apellido, email, dni, fechaNacimiento, cursoId, telefono, contactoEmergencia, contacto_emergencia } = data;
        nombre = String(nombre || '').trim();
        apellido = String(apellido || '').trim();
        email = String(email || '').trim().toLowerCase();
        dni = String(dni || '').replace(/\D/g, '');
        telefono = String(telefono || '').trim();
        const contactEmerg = String(contactoEmergencia || contacto_emergencia || '').trim();

        if (!nombre || !apellido || !email || !dni) {
            throw new BadRequestError('Nombre, apellido, email y DNI son obligatorios.');
        }

        assertEmail(email);
        assertDni(dni);

        if (rol === 'ALUMNO') {
            if (!fechaNacimiento) {
                throw new BadRequestError('La fecha de nacimiento es obligatoria para registrar un alumno (VAL-03).');
            }
            if (!contactEmerg) {
                throw new BadRequestError('El contacto de emergencia es obligatorio para registrar un alumno (VAL-03).');
            }
            assertMinimumAge(fechaNacimiento);
            const autoCourse = this.getCourseForBirthDate(fechaNacimiento);
            if (autoCourse && (!cursoId || !getCourse(cursoId))) {
                cursoId = autoCourse.id;
            }
        }

        const effectiveCourseId = cursoId || (Array.isArray(data.cursoIds) ? data.cursoIds[0] : null);
        if (!effectiveCourseId) {
            throw new BadRequestError('Debe seleccionar al menos un curso.');
        }
        const course = getCourse(effectiveCourseId);
        if (!course) throw new NotFoundError('El curso seleccionado no existe.');

        assertUnique(academy.users, 'email', email, 'El email ya está registrado.');
        assertUnique(academy.users, 'dni', dni, 'El DNI ya está registrado.');

        const rawPassword = data.password ? String(data.password) : email;
        const hashedPassword = bcrypt.hashSync(rawPassword, SALT_ROUNDS);

        const user = {
            id: id(),
            nombre,
            apellido,
            email,
            dni: String(dni),
            telefono,
            fechaNacimiento: fechaNacimiento || undefined,
            contactoEmergencia: contactEmerg || undefined,
            rol,
            password: hashedPassword,
            passwordHashed: true,
            estado: 'ACTIVO',
            estadoCobro: 'NO COBRADO'
        };

        academy.users.push(user);
        if (rol === 'ALUMNO') {
            this.enroll(user.id, course.id);
        } else {
            const courseIds = Array.isArray(data.cursoIds) && data.cursoIds.length > 0 
                ? data.cursoIds.map(Number) 
                : [course.id];
            
            courseIds.forEach((cid) => {
                if (getCourse(cid)) {
                    this.assignTeacher(cid, user.id);
                }
            });
        }

        saveState();
        return { ...user, password: undefined };
    }

    updateUser(userId, data) {
        const user = getUser(userId);
        if (!user) throw new NotFoundError('Usuario no encontrado.');

        let { nombre, apellido, email, dni, fechaNacimiento, telefono, cursoId, cursoIds, contactoEmergencia, contacto_emergencia } = data;
        nombre = String(nombre || '').trim();
        apellido = String(apellido || '').trim();
        email = String(email || '').trim().toLowerCase();
        dni = String(dni || '').replace(/\D/g, '');
        telefono = String(telefono || '').trim();
        const contactEmerg = String(contactoEmergencia || contacto_emergencia || user.contactoEmergencia || '').trim();

        const hasCourses = cursoId || (Array.isArray(cursoIds) && cursoIds.length > 0);
        if (!nombre || !apellido || !email || !dni || !hasCourses) {
            throw new BadRequestError('Faltan datos obligatorios, incluido el curso.');
        }
        assertEmail(email);
        assertDni(dni);

        if (user.rol === 'ALUMNO' && !contactEmerg) {
            throw new BadRequestError('El contacto de emergencia es obligatorio (VAL-03).');
        }

        const primaryCourseId = cursoId || (Array.isArray(cursoIds) ? cursoIds[0] : null);
        const course = getCourse(primaryCourseId);
        if (!course) throw new NotFoundError('El curso seleccionado no existe.');

        if (academy.users.some((item) => item.id !== user.id && (item.email === email || item.dni === String(dni)))) {
            throw new ConflictError('El email o DNI ya está registrado.');
        }

        Object.assign(user, {
            nombre,
            apellido,
            email,
            dni: String(dni),
            fechaNacimiento: fechaNacimiento || user.fechaNacimiento,
            telefono,
            contactoEmergencia: contactEmerg || undefined,
        });

        if (user.rol === 'ALUMNO') {
            const current = academy.inscripciones.find((item) => item.alumnoId === user.id && item.estado !== EstadoInscripcion.CANCELADA);
            if (!current || current.cursoId !== course.id) {
                if (current) current.estado = EstadoInscripcion.CANCELADA;
                this.enroll(user.id, course.id);
            }
        } else {
            const targetCourseIds = Array.isArray(cursoIds) && cursoIds.length > 0
                ? cursoIds.map(Number)
                : [course.id];

            // Retirar asignaciones no presentes
            academy.cursos.forEach((c) => {
                if (c.teacherId === user.id && !targetCourseIds.includes(c.id)) {
                    c.teacherId = undefined;
                }
            });

            // Asignar respetando control de horarios (RN-05)
            targetCourseIds.forEach((cid) => {
                const c = getCourse(cid);
                if (c) {
                    this.assignTeacher(cid, user.id);
                }
            });
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
        if (!user || !newPassword) throw new BadRequestError('No se pudo cambiar la contraseña.');

        let valid = false;
        if (user.passwordHashed) {
            valid = bcrypt.compareSync(String(currentPassword), user.password);
        } else {
            valid = user.password === String(currentPassword);
        }

        if (!valid) throw new BadRequestError('La contraseña actual es incorrecta.');

        user.password = bcrypt.hashSync(String(newPassword), SALT_ROUNDS);
        user.passwordHashed = true;
        saveState();
        return { success: true };
    }

    createCourse(data) {
        if (!data.name || !data.level || !Number.isInteger(Number(data.capacity)) || Number(data.capacity) <= 0) {
            throw new BadRequestError('Datos de curso inválidos: nombre, nivel y capacidad requeridos.');
        }
        const capacity = Number(data.capacity);
        const course = new Curso(id(), {
            ...data,
            capacity,
            schedule: data.schedule || `${(data.days || []).join(' y ')} ${data.startTime || ''} a ${data.endTime || ''}`.trim()
        });
        academy.cursos.push(course);
        saveState();
        return course;
    }

    updateCourse(courseId, data) {
        const course = getCourse(courseId);
        if (!course) throw new NotFoundError('Curso no encontrado.');

        if (data.name) course.name = String(data.name).trim();
        if (data.level) course.level = String(data.level).trim();
        if (data.capacity !== undefined) {
            const cap = Number(data.capacity);
            if (Number.isInteger(cap) && cap > 0) course.capacity = cap;
        }
        if (Array.isArray(data.days)) course.days = data.days;
        if (data.startTime !== undefined) course.startTime = data.startTime;
        if (data.endTime !== undefined) course.endTime = data.endTime;
        if (data.schedule !== undefined) course.schedule = data.schedule;
        if (data.prerequisiteLevel !== undefined) course.prerequisiteLevel = data.prerequisiteLevel || null;
        if (data.minAge !== undefined) course.minAge = Number(data.minAge);
        if (data.maxAge !== undefined) course.maxAge = Number(data.maxAge);

        // Si se actualizaron horarios, verificar que el docente asignado no tenga conflicto
        if (course.teacherId) {
            this.validateTeacherScheduleConflict(course.teacherId, course);
        }

        saveState();
        return course;
    }

    deleteCourse(courseId) {
        const idNum = Number(courseId);
        const index = academy.cursos.findIndex((c) => c.id === idNum);
        if (index === -1) throw new NotFoundError('Curso no encontrado.');

        const activeEnrollments = academy.inscripciones.filter(
            (i) => i.cursoId === idNum && [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA, EstadoInscripcion.EN_CURSO].includes(i.estado)
        );
        if (activeEnrollments.length > 0) {
            throw new ConflictError('No se puede eliminar un curso con inscripciones activas.');
        }

        academy.cursos.splice(index, 1);
        saveState();
        return { success: true };
    }

    validateTeacherScheduleConflict(teacherId, targetCourse) {
        const assignedCourses = academy.cursos.filter(
            (c) => c.teacherId === Number(teacherId) && c.id !== targetCourse.id
        );
        for (const existing of assignedCourses) {
            if (overlaps(targetCourse, existing)) {
                throw new ConflictError(
                    `El docente ya tiene asignado el curso "${existing.name}" en un día y horario que se superpone (RN-05).`
                );
            }
        }
    }

    assignTeacher(courseId, teacherId) {
        const course = getCourse(courseId);
        const teacher = getUser(teacherId);
        if (!course || !teacher) throw new NotFoundError('Curso o profesor no encontrado.');
        if (teacher.rol !== 'PROFESOR') throw new BadRequestError('El usuario no es profesor.');

        // RN-05: Validación de disponibilidad docente
        this.validateTeacherScheduleConflict(teacher.id, course);

        course.teacherId = teacher.id;
        saveState();
        return course;
    }

    enroll(studentId, courseId) {
        const student = getUser(studentId);
        const course = getCourse(courseId);
        if (!student || student.rol !== 'ALUMNO' || !course) throw new NotFoundError('Alumno o curso no encontrado.');

        // RN-01: Control de cupos
        const confirmed = academy.inscripciones.filter(
            (item) => item.cursoId === course.id && [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA, EstadoInscripcion.EN_CURSO].includes(item.estado)
        );
        if (confirmed.length >= course.capacity) throw new ConflictError('El curso alcanzó su capacidad máxima (RN-01).');

        // Verificar si ya está inscripto en este curso
        const existingEnrollment = academy.inscripciones.find(
            (item) => item.alumnoId === student.id && item.cursoId === course.id && item.estado !== EstadoInscripcion.CANCELADA
        );
        if (existingEnrollment) {
            return existingEnrollment;
        }

        // 1-curso-por-alumno: un alumno no puede estar en más de un curso activo
        const otherActiveEnrollment = academy.inscripciones.find(
            (item) => item.alumnoId === student.id &&
                      item.cursoId !== course.id &&
                      [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA, EstadoInscripcion.EN_CURSO].includes(item.estado)
        );
        if (otherActiveEnrollment) {
            const otherCourse = getCourse(otherActiveEnrollment.cursoId);
            throw new ConflictError(`El alumno ya está inscripto en "${otherCourse ? otherCourse.name : 'otro curso'}". Un alumno no puede estar en más de un curso activo a la vez.`);
        }

        // RN-02: Correlatividad
        if (course.prerequisiteLevel) {
            const hasPassedPrereq = academy.inscripciones.some(
                (item) => item.alumnoId === student.id && (
                    (item.level === course.prerequisiteLevel &&
                        item.estado === EstadoInscripcion.FINALIZADA &&
                        item.passed === true) ||
                    (item.historial || []).some((h) => h.level === course.prerequisiteLevel && h.passed === true)
                )
            );
            if (!hasPassedPrereq) {
                throw new ConflictError(`El alumno no aprobó el nivel previo requerido (${course.prerequisiteLevel}) (RN-02).`);
            }
        }

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

        // Bloquear calificación de alumnos con matrícula impaga (PENDIENTE)
        if (enrollment.estado === EstadoInscripcion.PENDIENTE) {
            throw new BadRequestError('El alumno no tiene el pago de matrícula confirmado y no puede ser calificado.');
        }

        // RN-03: Permisos de calificación
        if (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id) {
            throw new BadRequestError('El profesor no está asignado a este curso para cargar calificaciones (RN-03).');
        }
        const numValue = Number(value);
        if (typeof numValue !== 'number' || Number.isNaN(numValue) || numValue < 0 || numValue > 10) {
            throw new BadRequestError('La calificación debe estar entre 0 y 10.');
        }
        const grade = new Calificacion(id(), enrollment.id, teacher.id, numValue, period, metadata);
        academy.calificaciones.push(grade);
        saveState();
        return grade;
    }

    updateGrade(gradeId, teacher, data) {
        const grade = academy.calificaciones.find((g) => g.id === Number(gradeId));
        if (!grade) throw new NotFoundError('Calificación no encontrada.');
        const enrollment = getEnrollment(grade.inscripcionId);
        const course = enrollment && getCourse(enrollment.cursoId);

        // RN-03
        if (teacher.rol !== 'ADMIN' && (!course || course.teacherId !== teacher.id)) {
            throw new BadRequestError('No tiene permisos para modificar esta calificación (RN-03).');
        }

        if (data.value !== undefined) {
            const val = Number(data.value);
            if (Number.isNaN(val) || val < 0 || val > 10) throw new BadRequestError('La calificación debe estar entre 0 y 10.');
            grade.value = val;
        }
        if (data.name !== undefined) grade.name = String(data.name);
        if (data.description !== undefined) grade.description = String(data.description);
        if (data.period !== undefined) grade.period = String(data.period);
        if (data.date !== undefined) grade.date = String(data.date);

        saveState();
        return grade;
    }

    deleteGrade(gradeId, user) {
        const index = academy.calificaciones.findIndex((g) => g.id === Number(gradeId));
        if (index === -1) throw new NotFoundError('Calificación no encontrada.');
        const grade = academy.calificaciones[index];
        const enrollment = getEnrollment(grade.inscripcionId);
        const course = enrollment && getCourse(enrollment.cursoId);

        if (user.rol !== 'ADMIN' && (!course || course.teacherId !== user.id)) {
            throw new BadRequestError('No tiene permisos para eliminar esta calificación (RN-03).');
        }

        academy.calificaciones.splice(index, 1);
        saveState();
        return { success: true };
    }

    recordAttendance(enrollmentId, teacher, date, present) {
        const enrollment = getEnrollment(enrollmentId);
        const course = enrollment && getCourse(enrollment.cursoId);
        if (!enrollment || !course) throw new NotFoundError('Inscripción no encontrada.');
        if (teacher.rol !== 'ADMIN' && course.teacherId !== teacher.id) {
            throw new BadRequestError('El profesor no está asignado a este curso.');
        }
        if (enrollment.estado === EstadoInscripcion.PENDIENTE) {
            throw new BadRequestError('El alumno no tiene el pago de matrícula confirmado y no puede registrar asistencia.');
        }
        const day = date || todayISO();
        const existing = academy.asistencias.find((a) => a.inscripcionId === enrollment.id && a.date === day);
        let attendance;
        if (existing) {
            existing.present = Boolean(present);
            existing.teacherId = teacher.id;
            attendance = existing;
        } else {
            attendance = new Asistencia(id(), enrollment.id, teacher.id, day, Boolean(present));
            academy.asistencias.push(attendance);
        }
        this.refreshAttendance(enrollment);
        saveState();
        return attendance;
    }

    payEnrollment(enrollmentId, amount, method) {
        const enrollment = getEnrollment(enrollmentId);
        if (!enrollment || !amount || !method) throw new BadRequestError('Datos de pago inválidos.');
        const payment = {
            id: id(),
            enrollmentId: enrollment.id,
            alumnoId: enrollment.alumnoId,
            cursoId: enrollment.cursoId,
            amount: Number(amount),
            method: String(method),
            status: 'PAGADO',
            date: new Date().toISOString()
        };
        academy.pagos.push(payment);
        // Transición de estado: el pago confirma la inscripción
        enrollment.estado = EstadoInscripcion.CONFIRMADA;
        saveState();
        return payment;
    }

    // Registra el pago mensual de un docente (un pago por docente y período YYYY-MM)
    payTeacher(teacherId, period, amount, method) {
        const teacher = getUser(teacherId);
        if (!teacher || teacher.rol !== 'PROFESOR') throw new NotFoundError('El docente no existe.');
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(period))) throw new BadRequestError('Período inválido (use AAAA-MM).');
        if (!Number(amount) || Number(amount) <= 0 || !method) throw new BadRequestError('Monto y método de pago son obligatorios.');
        if (academy.pagosDocentes.some((p) => p.teacherId === teacher.id && p.period === period)) {
            throw new ConflictError('Ya se registró el pago de este docente para ese mes.');
        }
        const payment = {
            id: id(),
            teacherId: teacher.id,
            period,
            amount: Number(amount),
            method: String(method),
            status: 'PAGADO',
            date: new Date().toISOString()
        };
        academy.pagosDocentes.push(payment);
        saveState();
        return payment;
    }

    updateEnrollmentState(enrollmentId, state, passed = null) {
        const enrollment = getEnrollment(enrollmentId);
        if (!enrollment || !Object.values(EstadoInscripcion).includes(state)) {
            throw new BadRequestError('Estado de inscripción inválido.');
        }
        enrollment.estado = state;
        if (state === EstadoInscripcion.FINALIZADA) {
            enrollment.passed = passed !== null ? Boolean(passed) : true;
            enrollment.fechaFinalizacion = new Date().toISOString();
        } else if (state === EstadoInscripcion.CANCELADA) {
            enrollment.passed = false;
        }
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

    startAcademicCycle(courseId) {
        const course = getCourse(courseId);
        if (!course) throw new NotFoundError('Curso no encontrado.');
        if (course.cicloIniciado) throw new ConflictError('El ciclo lectivo ya fue iniciado.');
        if (course.cicloFinalizado) throw new ConflictError('El ciclo lectivo ya fue finalizado. Para reabrir, use renovación de año.');

        course.cicloIniciado = true;
        course.cicloFinalizado = false;

        // Mover inscripciones CONFIRMADAS a EN_CURSO
        academy.inscripciones
            .filter((ins) => ins.cursoId === course.id && ins.estado === EstadoInscripcion.CONFIRMADA)
            .forEach((ins) => { ins.estado = EstadoInscripcion.EN_CURSO; });

        saveState();
        return course;
    }

    finishAcademicCycle(courseId) {
        const course = getCourse(courseId);
        if (!course) throw new NotFoundError('Curso no encontrado.');
        if (!course.cicloIniciado && !course.cicloFinalizado === false) {
            // allow finishing even if never formally "started" via button
        }
        if (course.cicloFinalizado) throw new ConflictError('El ciclo lectivo ya fue finalizado.');

        course.cicloIniciado = false;
        course.cicloFinalizado = true;
        course.fechaFinCiclo = new Date().toISOString().slice(0, 10);

        const PASA_NOTA = 6;

        // Finalizar todas las inscripciones activas del curso
        academy.inscripciones
            .filter((ins) => ins.cursoId === course.id && ACTIVE_STATES.includes(ins.estado))
            .forEach((ins) => {
                const stats = this.refreshAttendance(ins);

                if (stats.porcentaje < MIN_ATTENDANCE_PCT) {
                    // Desaprobado por faltas
                    ins.desaprobadoPorFaltas = true;
                    ins.passed = false;
                } else {
                    // Verificar nota promedio
                    const grades = academy.calificaciones.filter((g) => g.inscripcionId === ins.id);
                    const avg = grades.length > 0
                        ? grades.reduce((acc, g) => acc + g.value, 0) / grades.length
                        : null;
                    ins.promedioFinal = avg !== null ? Math.round(avg * 100) / 100 : null;
                    ins.passed = avg !== null ? avg >= PASA_NOTA : false;
                    ins.desaprobadoPorFaltas = false;
                }

                ins.estado = EstadoInscripcion.FINALIZADA;
                ins.fechaFinalizacion = new Date().toISOString();
            });

        saveState();
        return course;
    }

    renewAcademicYear(enrollmentId, targetCourseId) {
        const prevEnrollment = getEnrollment(enrollmentId);
        if (!prevEnrollment) throw new NotFoundError('Inscripción no encontrada.');
        if (prevEnrollment.estado !== EstadoInscripcion.FINALIZADA) {
            throw new BadRequestError('Solo se puede renovar una inscripción finalizada.');
        }

        const targetCourse = getCourse(targetCourseId || prevEnrollment.cursoId);
        if (!targetCourse) throw new NotFoundError('Curso destino no encontrado.');

        // Un alumno no puede estar en más de un curso activo a la vez
        const alreadyActive = academy.inscripciones.find(
            (ins) => ins.alumnoId === prevEnrollment.alumnoId && ACTIVE_STATES.includes(ins.estado)
        );
        if (alreadyActive) throw new ConflictError('El alumno ya tiene una inscripción activa. Un alumno no puede estar en más de un curso a la vez.');

        // Reabrir el ciclo del curso destino para el nuevo período
        if (targetCourse.cicloFinalizado) {
            targetCourse.cicloFinalizado = false;
            targetCourse.cicloIniciado = false;
            targetCourse.cicloLectivo = String(Number(targetCourse.cicloLectivo || new Date().getFullYear()) + 1);
            targetCourse.fechaInicio = shiftYear(targetCourse.fechaInicio, 1);
            targetCourse.fechaFin = shiftYear(targetCourse.fechaFin, 1);
            targetCourse.fechaFinCiclo = null;
        }

        // Se actualiza la misma inscripción: el período anterior pasa al historial
        const prevCourse = getCourse(prevEnrollment.cursoId);
        const prevAsistencias = academy.asistencias.filter((a) => a.inscripcionId === prevEnrollment.id);
        const prevCalificaciones = academy.calificaciones.filter((g) => g.inscripcionId === prevEnrollment.id);
        const grades = prevCalificaciones.map((g) => g.value);
        prevEnrollment.historial = [
            ...(prevEnrollment.historial || []),
            {
                cicloLectivo: prevEnrollment.cicloLectivo,
                cursoId: prevEnrollment.cursoId,
                cursoNombre: prevCourse?.name || '',
                level: prevEnrollment.level,
                passed: prevEnrollment.passed,
                desaprobadoPorFaltas: Boolean(prevEnrollment.desaprobadoPorFaltas),
                porcentajeAsistencia: prevEnrollment.porcentajeAsistencia ?? 0,
                promedioFinal: grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : null,
                fechaFinalizacion: prevEnrollment.fechaFinalizacion,
                asistencias: prevAsistencias,
                calificaciones: prevCalificaciones,
            },
        ];
        academy.asistencias = academy.asistencias.filter((a) => a.inscripcionId !== prevEnrollment.id);
        academy.calificaciones = academy.calificaciones.filter((g) => g.inscripcionId !== prevEnrollment.id);

        prevEnrollment.cursoId = targetCourse.id;
        prevEnrollment.level = targetCourse.level;
        prevEnrollment.cicloLectivo = String(targetCourse.cicloLectivo);
        prevEnrollment.estado = EstadoInscripcion.PENDIENTE;
        prevEnrollment.fecha = new Date().toISOString();
        prevEnrollment.passed = null;
        prevEnrollment.fechaFinalizacion = null;
        prevEnrollment.porcentajeAsistencia = null;
        prevEnrollment.asistenciasPresentes = 0;
        prevEnrollment.ausencias = 0;
        prevEnrollment.promedioFinal = null;
        prevEnrollment.desaprobadoPorFaltas = false;
        saveState();
        return prevEnrollment;
    }
}

export default new AcademyService();
