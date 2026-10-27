/**
 * Calcula la edad exacta en años a partir de la fecha de nacimiento (YYYY-MM-DD).
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

/**
 * Retorna el nombre del curso según la edad:
 * - 4 a 6 años: Inicial 1
 * - 7 a 10 años (8 a 10): Inicial 2
 * - 11 a 13 años: Adolescentes 1
 * - 14 a 17 años: Adolescentes 2
 * - 18 a 30 años: Adultos 1
 * - +30 años: Adultos 2
 */
export const getCourseNameByAge = (age) => {
  if (age === null || age === undefined || age < 4) return null;
  if (age >= 4 && age <= 6) return 'Inicial 1';
  if (age >= 7 && age <= 10) return 'Inicial 2';
  if (age >= 11 && age <= 13) return 'Adolescentes 1';
  if (age >= 14 && age <= 17) return 'Adolescentes 2';
  if (age >= 18 && age <= 30) return 'Adultos 1';
  if (age > 30) return 'Adultos 2';
  return 'Adultos 2';
};

/**
 * Retorna información detallada del curso asignado por edad.
 */
export const getCourseMetaByAge = (age) => {
  if (age === null || age === undefined || age < 4) return null;
  if (age >= 4 && age <= 6) {
    return { name: 'Inicial 1', bracket: '4 a 6 años', schedule: 'Martes y jueves 17:00 a 18:00' };
  }
  if (age >= 7 && age <= 10) {
    return { name: 'Inicial 2', bracket: '8 a 10 años', schedule: 'Martes y jueves 17:00 a 18:00' };
  }
  if (age >= 11 && age <= 13) {
    return { name: 'Adolescentes 1', bracket: '11 a 13 años', schedule: 'Lunes y miércoles 17:30 a 18:30' };
  }
  if (age >= 14 && age <= 17) {
    return { name: 'Adolescentes 2', bracket: '14 a 17 años', schedule: 'Martes y jueves 18:00 a 19:00' };
  }
  if (age >= 18 && age <= 30) {
    return { name: 'Adultos 1', bracket: '18 a 30 años', schedule: 'Lunes y miércoles 19:00 a 20:00' };
  }
  return { name: 'Adultos 2', bracket: '+30 años', schedule: 'Martes y jueves 19:00 a 20:00' };
};

/**
 * Obtiene las iniciales de una persona para avatar visual.
 */
export const getInitials = (nombre, apellido) => {
  const n = (nombre || '').trim();
  const a = (apellido || '').trim();
  if (!n && !a) return 'U';
  return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();
};
