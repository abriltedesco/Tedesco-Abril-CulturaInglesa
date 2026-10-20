import academy from '../repositories/AcademyRepository.js';
import academyService from '../services/AcademyService.js';
import { successResponse } from '../responses/ApiResponse.js';

class AcademyController {
    registerStudent = (req, res, next) => this.run(res, next, () => academyService.registerUser(req.body, 'ALUMNO'), 201);
    registerTeacher = (req, res, next) => this.run(res, next, () => academyService.registerUser(req.body, 'PROFESOR'), 201);
    updateUser = (req, res, next) => this.run(res, next, () => academyService.updateUser(req.params.userId, req.body));
    changePassword = (req, res, next) => this.run(res, next, () => academyService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword));
    createCourse = (req, res, next) => this.run(res, next, () => academyService.createCourse(req.body), 201);
    assignTeacher = (req, res, next) => this.run(res, next, () => academyService.assignTeacher(req.params.courseId, req.body.teacherId));
    enroll = (req, res, next) => this.run(res, next, () => academyService.enroll(req.user.rol === 'ALUMNO' ? req.user.id : req.body.studentId, req.body.courseId), 201);
    grade = (req, res, next) => this.run(res, next, () => academyService.recordGrade(req.body.enrollmentId, req.user, req.body.value, req.body.period, { name: req.body.name, description: req.body.description, date: req.body.date }), 201);
    attendance = (req, res, next) => this.run(res, next, () => academyService.recordAttendance(req.body.enrollmentId, req.user, req.body.date, req.body.present), 201);
    payment = (req, res, next) => this.run(res, next, () => academyService.payEnrollment(req.body.enrollmentId, req.body.amount, req.body.method), 201);
    enrollmentState = (req, res, next) => this.run(res, next, () => academyService.updateEnrollmentState(req.params.enrollmentId, req.body.state));
    announcement = (req, res, next) => this.run(res, next, () => academyService.announce(req.user, req.body.courseId, req.body.message), 201);
    list = (req, res) => {
        const users = academy.users.map(({ password, ...user }) => user);
        if (req.user.rol === 'ADMIN') return successResponse(res, { ...academy, users });
        const ownUser = users.filter((user) => user.id === req.user.id);
        const ownEnrollments = academy.inscripciones.filter((item) => item.alumnoId === req.user.id);
        const ownCourseIds = req.user.rol === 'PROFESOR' ? academy.cursos.filter((course) => course.teacherId === req.user.id).map((course) => course.id) : [];
        const visibleUsers = req.user.rol === 'PROFESOR'
            ? users.filter((user) => academy.inscripciones.some((item) => item.alumnoId === user.id && ownCourseIds.includes(item.cursoId)))
            : ownUser;
        return successResponse(res, {
            users: [...ownUser, ...visibleUsers],
            cursos: req.user.rol === 'PROFESOR' ? academy.cursos.filter((course) => ownCourseIds.includes(course.id)) : academy.cursos,
            inscripciones: req.user.rol === 'PROFESOR' ? academy.inscripciones.filter((item) => ownCourseIds.includes(item.cursoId)) : ownEnrollments,
            calificaciones: req.user.rol === 'ALUMNO' ? academy.calificaciones.filter((item) => ownEnrollments.some((enrollment) => enrollment.id === item.inscripcionId)) : academy.calificaciones,
            asistencias: req.user.rol === 'ALUMNO' ? academy.asistencias.filter((item) => ownEnrollments.some((enrollment) => enrollment.id === item.inscripcionId)) : academy.asistencias,
            pagos: req.user.rol === 'ALUMNO' ? academy.pagos.filter((item) => ownEnrollments.some((enrollment) => enrollment.id === item.enrollmentId)) : academy.pagos,
            anuncios: academy.anuncios.filter((item) => req.user.rol === 'PROFESOR' ? ownCourseIds.includes(item.courseId) : ownEnrollments.some((enrollment) => enrollment.cursoId === item.courseId)),
        });
    };
    run(res, next, callback, status = 200) { try { return successResponse(res, callback(), status); } catch (error) { return next(error); } }
}

export default new AcademyController();
