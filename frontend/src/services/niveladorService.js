import { request } from './api';

export const niveladorService = {
  getPreguntas: () => request('/nivelador/preguntas'),
  evaluar: (data) => request('/nivelador/evaluar', { method: 'POST', body: JSON.stringify(data) }),
};
