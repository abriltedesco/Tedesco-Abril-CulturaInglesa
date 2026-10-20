import { request } from './api';

export const academyService = {
  getState: () => request('/academy/state'),
  registerStudent: (data) => request('/academy/students', { method: 'POST', body: JSON.stringify(data) }),
  registerTeacher: (data) => request('/academy/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/academy/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createCourse: (data) => request('/academy/courses', { method: 'POST', body: JSON.stringify(data) }),
  grade: (data) => request('/academy/grades', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request('/academy/password', { method: 'PATCH', body: JSON.stringify(data) }),
};
