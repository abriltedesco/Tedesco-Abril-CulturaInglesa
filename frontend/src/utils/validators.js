export const validarEmail = (email) => {
  if (!email || !email.trim()) return 'El correo electrónico es requerido.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return 'Ingresá un correo electrónico válido.';
  return '';
};

export const validarNombre = (nombre) => {
  if (!nombre || !nombre.trim()) return 'El nombre es requerido.';
  if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
  return '';
};

export const validarApellido = (apellido) => {
  if (!apellido || !apellido.trim()) return 'El apellido es requerido.';
  if (apellido.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres.';
  return '';
};

export const validarTelefono = (telefono) => {
  if (!telefono || !telefono.trim()) return 'El teléfono es requerido.';
  const cleanPhone = telefono.replace(/[\s\-\(\)]/g, '');
  if (!/^\d{7,15}$/.test(cleanPhone)) return 'Ingresá un número de teléfono válido (solo números, entre 7 y 15 dígitos).';
  return '';
};

export const validarMensaje = (mensaje) => {
  if (!mensaje || !mensaje.trim()) return 'El mensaje es requerido.';
  if (mensaje.trim().length < 10) return 'El mensaje debe contener al menos 10 caracteres.';
  return '';
};

// Aliases for compatibility
export const validateEmail = validarEmail;
export const validateNombre = validarNombre;
export const validateApellido = validarApellido;
export const validateTelefono = validarTelefono;
export const validateMensaje = validarMensaje;

