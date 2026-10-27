import { Router } from 'express';
import controller from '../controllers/AcademyController.js';
import { requireRoles } from '../middlewares/requireRoles.js';
import { requireAuth } from '../middlewares/requireAdmin.js';

const router = Router();
router.use(requireAuth);
router.post('/students', requireRoles('ADMIN'), controller.registerStudent);
router.post('/teachers', requireRoles('ADMIN'), controller.registerTeacher);
router.patch('/users/:userId', requireRoles('ADMIN'), controller.updateUser);
router.delete('/users/:userId', requireRoles('ADMIN'), controller.deleteUser);
router.patch('/password', controller.changePassword);
router.post('/courses', requireRoles('ADMIN'), controller.createCourse);
router.patch('/courses/:courseId/teacher', requireRoles('ADMIN'), controller.assignTeacher);
router.post('/enrollments', requireRoles('ADMIN', 'ALUMNO'), controller.enroll);
router.post('/grades', requireRoles('ADMIN', 'PROFESOR'), controller.grade);
router.post('/attendance', requireRoles('ADMIN', 'PROFESOR'), controller.attendance);
router.post('/payments', requireRoles('ADMIN'), controller.payment);
router.patch('/enrollments/:enrollmentId/state', requireRoles('ADMIN'), controller.enrollmentState);
router.post('/announcements', requireRoles('ADMIN', 'PROFESOR'), controller.announcement);
router.get('/state', requireRoles('ADMIN', 'PROFESOR', 'ALUMNO'), controller.list);

export default router;
