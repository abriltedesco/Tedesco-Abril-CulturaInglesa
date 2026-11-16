import { request } from './api';

export const academyService = {
  getState: () => request('/academy/state'),

  // Usuarios
  registerStudent: (data) => request('/academy/students', { method: 'POST', body: JSON.stringify(data) }),
  registerTeacher: (data) => request('/academy/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/academy/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/academy/users/${id}`, { method: 'DELETE' }),
  changePassword: (data) => request('/academy/password', { method: 'PATCH', body: JSON.stringify(data) }),

  // Cursos
  createCourse: (data) => request('/academy/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => request(`/academy/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCourse: (id) => request(`/academy/courses/${id}`, { method: 'DELETE' }),
  assignTeacher: (courseId, teacherId) => request(`/academy/courses/${courseId}/teacher`, { method: 'PATCH', body: JSON.stringify({ teacherId }) }),
  startCycle: (courseId) => request(`/academy/courses/${courseId}/cycle/start`, { method: 'POST' }),
  finishCycle: (courseId) => request(`/academy/courses/${courseId}/cycle/finish`, { method: 'POST' }),

  // Inscripciones
  enroll: (data) => request('/academy/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  renewEnrollment: (enrollmentId, targetCourseId) =>
    request(`/academy/enrollments/${enrollmentId}/renew`, { method: 'POST', body: JSON.stringify({ targetCourseId }) }),
  updateEnrollmentState: (enrollmentId, state, passed = null) =>
    request(`/academy/enrollments/${enrollmentId}/state`, { method: 'PATCH', body: JSON.stringify({ state, passed }) }),

  // Calificaciones
  grade: (data) => request('/academy/grades', { method: 'POST', body: JSON.stringify(data) }),
  updateGrade: (id, data) => request(`/academy/grades/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGrade: (id) => request(`/academy/grades/${id}`, { method: 'DELETE' }),

  // Asistencia y Pagos
  recordAttendance: (data) => request('/academy/attendance', { method: 'POST', body: JSON.stringify(data) }),
  payTeacher: (data) => request('/academy/teacher-payments', { method: 'POST', body: JSON.stringify(data) }),
  payEnrollment: (data) => request('/academy/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Anuncios y Contactos
  announce: (data) => request('/academy/announcements', { method: 'POST', body: JSON.stringify(data) }),
  getContactos: () => request('/academy/contactos'),
};
