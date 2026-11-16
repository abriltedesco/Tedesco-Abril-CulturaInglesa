import { Router } from 'express';
import controller from '../controllers/AcademyController.js';
import { requireRoles } from '../middlewares/requireRoles.js';
import { requireAuth } from '../middlewares/requireAdmin.js';

const router = Router();
router.use(requireAuth);

// Gestión de Usuarios (sólo ADMIN)
router.post('/students', requireRoles('ADMIN'), controller.registerStudent);
router.post('/teachers', requireRoles('ADMIN'), controller.registerTeacher);
router.patch('/users/:userId', requireRoles('ADMIN'), controller.updateUser);
router.delete('/users/:userId', requireRoles('ADMIN'), controller.deleteUser);
router.patch('/password', controller.changePassword);

// Cursos CRUD
router.post('/courses', requireRoles('ADMIN'), controller.createCourse);
router.patch('/courses/:courseId', requireRoles('ADMIN'), controller.updateCourse);
router.delete('/courses/:courseId', requireRoles('ADMIN'), controller.deleteCourse);
router.patch('/courses/:courseId/teacher', requireRoles('ADMIN'), controller.assignTeacher);
router.post('/courses/:courseId/cycle/start', requireRoles('ADMIN'), controller.startCycle);
router.post('/courses/:courseId/cycle/finish', requireRoles('ADMIN'), controller.finishCycle);

// Inscripciones
router.post('/enrollments', requireRoles('ADMIN', 'ALUMNO'), controller.enroll);
router.patch('/enrollments/:enrollmentId/state', requireRoles('ADMIN'), controller.enrollmentState);
router.post('/enrollments/:enrollmentId/renew', requireRoles('ADMIN', 'ALUMNO'), controller.renewYear);

// Calificaciones (RN-03: ADMIN o PROFESOR)
router.post('/grades', requireRoles('ADMIN', 'PROFESOR'), controller.grade);
router.patch('/grades/:gradeId', requireRoles('ADMIN', 'PROFESOR'), controller.updateGrade);
router.delete('/grades/:gradeId', requireRoles('ADMIN', 'PROFESOR'), controller.deleteGrade);

// Asistencias y Pagos
router.post('/attendance', requireRoles('ADMIN', 'PROFESOR'), controller.attendance);
router.post('/payments', requireRoles('ADMIN'), controller.payment);
router.post('/teacher-payments', requireRoles('ADMIN'), controller.teacherPayment);

// Anuncios
router.post('/announcements', requireRoles('ADMIN', 'PROFESOR'), controller.announcement);

// Contactos (sólo ADMIN)
router.get('/contactos', requireRoles('ADMIN'), controller.listContactos);

// Estado general según rol
router.get('/state', requireRoles('ADMIN', 'PROFESOR', 'ALUMNO'), controller.list);

export default router;
