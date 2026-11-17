import academy, { id, saveState } from '../repositories/AcademyRepository.js';
import academyService from '../services/AcademyService.js';
import { ForbiddenError } from '../exceptions/AppError.js';
import { successResponse } from '../responses/ApiResponse.js';

class AcademyController {
    registerStudent = (req, res, next) => this.run(res, next, () => academyService.registerUser(req.body, 'ALUMNO'), 201);
    registerTeacher = (req, res, next) => this.run(res, next, () => academyService.registerUser(req.body, 'PROFESOR'), 201);
    updateUser = (req, res, next) => this.run(res, next, () => academyService.updateUser(req.params.userId, req.body));
    deleteUser = (req, res, next) => this.run(res, next, () => academyService.deleteUser(req.params.userId));
    changePassword = (req, res, next) => this.run(res, next, () => academyService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword));

    // Cursos CRUD
    createCourse = (req, res, next) => this.run(res, next, () => academyService.createCourse(req.body), 201);
    updateCourse = (req, res, next) => this.run(res, next, () => academyService.updateCourse(req.params.courseId, req.body));
    deleteCourse = (req, res, next) => this.run(res, next, () => academyService.deleteCourse(req.params.courseId));
    assignTeacher = (req, res, next) => this.run(res, next, () => academyService.assignTeacher(req.params.courseId, req.body.teacherId));
    startCycle = (req, res, next) => this.run(res, next, () => academyService.startAcademicCycle(req.params.courseId));
    finishCycle = (req, res, next) => this.run(res, next, () => academyService.finishAcademicCycle(req.params.courseId));

    // Inscripciones
    enroll = (req, res, next) => this.run(res, next, () => academyService.enroll(req.user.rol === 'ALUMNO' ? req.user.id : req.body.studentId, req.body.courseId), 201);
    enrollmentState = (req, res, next) => this.run(res, next, () => academyService.updateEnrollmentState(req.params.enrollmentId, req.body.state, req.body.passed));
    payment = (req, res, next) => this.run(res, next, () => academyService.payEnrollment(req.body.enrollmentId, req.body.amount, req.body.method), 201);
    teacherPayment = (req, res, next) => this.run(res, next, () => academyService.payTeacher(req.body.teacherId, req.body.period, req.body.amount, req.body.method), 201);
    renewYear = (req, res, next) => this.run(res, next, () => {
        if (req.user.rol === 'ALUMNO') {
            const own = academy.inscripciones.find((i) => i.id === Number(req.params.enrollmentId));
            if (!own || own.alumnoId !== req.user.id) throw new ForbiddenError('No podés renovar una inscripción ajena.');
        }
        return academyService.renewAcademicYear(req.params.enrollmentId, req.body.targetCourseId);
    }, 201);

    // Calificaciones
    grade = (req, res, next) => this.run(res, next, () => academyService.recordGrade(req.body.enrollmentId, req.user, req.body.value, req.body.period, { name: req.body.name, description: req.body.description, date: req.body.date }), 201);
    updateGrade = (req, res, next) => this.run(res, next, () => academyService.updateGrade(req.params.gradeId, req.user, req.body));
    deleteGrade = (req, res, next) => this.run(res, next, () => academyService.deleteGrade(req.params.gradeId, req.user));

    // Asistencias (individual o lote)
    attendance = (req, res, next) => this.run(res, next, () => {
        if (Array.isArray(req.body.records)) {
            const results = req.body.records.map((r) =>
                academyService.recordAttendance(r.enrollmentId, req.user, req.body.date || r.date, r.present)
            );
            return results;
        }
        return academyService.recordAttendance(req.body.enrollmentId, req.user, req.body.date, req.body.present);
    }, 201);

    announcement = (req, res, next) => this.run(res, next, () => academyService.announce(req.user, req.body.courseId, req.body.message), 201);

    // Contactos recibidos (sólo Admin)
    listContactos = (req, res) => {
        return successResponse(res, academy.contactos || []);
    };

    list = (req, res) => {
        academyService.syncAcademicCycles();
        const users = academy.users.map(({ password, ...user }) => user);
        if (req.user.rol === 'ADMIN') {
            return successResponse(res, {
                ...academy,
                users,
                contactos: academy.contactos || []
            });
        }

        const ownUser = users.filter((user) => user.id === req.user.id);
        const ownEnrollments = academy.inscripciones.filter((item) => item.alumnoId === req.user.id);
        const ownEnrollmentIds = ownEnrollments.map((e) => e.id);
        
        const teacherAssignedCourses = academy.cursos.filter((course) => course.teacherId === req.user.id);
        const ownCourseIds = teacherAssignedCourses.map((c) => c.id);

        // Nómina del docente: sólo alumnos con matrícula al día (no PENDIENTE ni CANCELADA)
        const ROSTER_STATES = ['CONFIRMADA', 'EN_CURSO', 'FINALIZADA'];
        const teacherEnrollments = academy.inscripciones.filter((item) =>
            ownCourseIds.includes(item.cursoId) && ROSTER_STATES.includes(item.estado));
        const teacherEnrollmentIds = teacherEnrollments.map((e) => e.id);

        const visibleUsers = req.user.rol === 'PROFESOR'
            ? users.filter((user) => teacherEnrollments.some((item) => item.alumnoId === user.id))
            : ownUser;

        const teacherCoursesList = academy.cursos.map((c) => ({
            ...c,
            isAssigned: ownCourseIds.includes(c.id)
        }));

        return successResponse(res, {
            users: [...ownUser, ...visibleUsers],
            cursos: req.user.rol === 'PROFESOR' ? teacherCoursesList : academy.cursos,
            assignedCourses: req.user.rol === 'PROFESOR' ? teacherAssignedCourses : [],
            inscripciones: req.user.rol === 'PROFESOR' ? teacherEnrollments : ownEnrollments,
            calificaciones: req.user.rol === 'ALUMNO' 
                ? academy.calificaciones.filter((item) => ownEnrollmentIds.includes(item.inscripcionId))
                : req.user.rol === 'PROFESOR'
                    ? academy.calificaciones.filter((item) => teacherEnrollmentIds.includes(item.inscripcionId))
                    : academy.calificaciones,
            asistencias: req.user.rol === 'ALUMNO'
                ? academy.asistencias.filter((item) => ownEnrollmentIds.includes(item.inscripcionId))
                : req.user.rol === 'PROFESOR'
                    ? academy.asistencias.filter((item) => teacherEnrollmentIds.includes(item.inscripcionId))
                    : academy.asistencias,
            pagos: req.user.rol === 'ALUMNO'
                ? academy.pagos.filter((item) => ownEnrollmentIds.includes(item.enrollmentId) || item.alumnoId === req.user.id)
                : academy.pagos,
            pagosDocentes: req.user.rol === 'PROFESOR'
                ? academy.pagosDocentes.filter((item) => item.teacherId === req.user.id)
                : [],
            anuncios: academy.anuncios.filter((item) =>
                req.user.rol === 'PROFESOR' 
                    ? (ownCourseIds.length === 0 || ownCourseIds.includes(item.courseId)) 
                    : ownEnrollments.some((enrollment) => enrollment.cursoId === item.courseId)
            ),
        });
    };

    run(res, next, callback, status = 200) {
        try {
            return successResponse(res, callback(), status);
        } catch (error) {
            return next(error);
        }
    }
}

export default new AcademyController();
