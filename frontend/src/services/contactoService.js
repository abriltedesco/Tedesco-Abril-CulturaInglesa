import { request } from './api';

export const contactoService = {
  enviar: (data) => request('/contacto', { method: 'POST', body: JSON.stringify(data) }),
};
