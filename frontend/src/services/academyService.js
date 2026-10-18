import { request } from './api';

export const academyService = {
  registerStudent: (data) => request('/academy/students', { method: 'POST', body: JSON.stringify(data) }),
  registerTeacher: (data) => request('/academy/teachers', { method: 'POST', body: JSON.stringify(data) }),
};
