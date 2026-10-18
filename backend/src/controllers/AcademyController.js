import academy from '../repositories/AcademyRepository.js';
import academyService from '../services/AcademyService.js';
import { successResponse } from '../responses/ApiResponse.js';

class AcademyController {
    registerStudent = (req, res, next) => this.run(res, next, () => academyService.registerUser(req.body, 'ALUMNO'), 201);
    registerTeacher = (req, res, next) => this.run(res, next, () => academyService.registerUser(req.body, 'PROFESOR'), 201);
    changePassword = (req, res, next) => this.run(res, next, () => academyService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword));
    createCourse = (req, res, next) => this.run(res, next, () => academyService.createCourse(req.body), 201);
    assignTeacher = (req, res, next) => this.run(res, next, () => academyService.assignTeacher(req.params.courseId, req.body.teacherId));
    enroll = (req, res, next) => this.run(res, next, () => academyService.enroll(req.user.rol === 'ALUMNO' ? req.user.id : req.body.studentId, req.body.courseId), 201);
    grade = (req, res, next) => this.run(res, next, () => academyService.recordGrade(req.body.enrollmentId, req.user, req.body.value, req.body.period), 201);
    attendance = (req, res, next) => this.run(res, next, () => academyService.recordAttendance(req.body.enrollmentId, req.user, req.body.date, req.body.present), 201);
    payment = (req, res, next) => this.run(res, next, () => academyService.payEnrollment(req.body.enrollmentId, req.body.amount, req.body.method), 201);
    enrollmentState = (req, res, next) => this.run(res, next, () => academyService.updateEnrollmentState(req.params.enrollmentId, req.body.state));
    announcement = (req, res, next) => this.run(res, next, () => academyService.announce(req.user, req.body.courseId, req.body.message), 201);
    list = (req, res) => successResponse(res, { ...academy, users: academy.users.map(({ password, ...user }) => user) });
    run(res, next, callback, status = 200) { try { return successResponse(res, callback(), status); } catch (error) { return next(error); } }
}

export default new AcademyController();
