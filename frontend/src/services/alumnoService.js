import { request } from './api';

export const alumnoService = {
  getAll: () => request('/alumnos'),
  getById: (id) => request(`/alumnos/${id}`),
  create: (data) => request('/alumnos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/alumnos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  remove: (id) => request(`/alumnos/${id}`, {
    method: 'DELETE',
  }),
};
