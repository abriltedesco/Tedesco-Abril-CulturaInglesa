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
 * Retorna el curso sugerido según la edad:
 * - 4 y 5 años: Kids / 6 y 7: First Grade / 8 y 9: Second Grade
 * - 10 y 11: Third Grade / 12 y 13: Fourth Grade
 * - desde los 14: Third Year (punto de entrada; desde ahí se elige con libertad)
 */
export const getCourseNameByAge = (age) => {
  if (age === null || age === undefined || age < 4) return null;
  if (age <= 5) return 'Kids';
  if (age <= 7) return 'First Grade';
  if (age <= 9) return 'Second Grade';
  if (age <= 11) return 'Third Grade';
  if (age <= 13) return 'Fourth Grade';
  return 'Third Year';
};

const SCHEDULES = {
  Kids: 'Martes y jueves 17:00 a 18:00',
  'First Grade': 'Lunes y miércoles 17:00 a 18:00',
  'Second Grade': 'Martes y jueves 17:00 a 18:00',
  'Third Grade': 'Lunes y miércoles 17:00 a 18:00',
  'Fourth Grade': 'Martes y jueves 17:00 a 18:00',
  'Third Year': 'Lunes y miércoles 17:30 a 18:30',
};
const BRACKETS = {
  Kids: '4 a 5 años',
  'First Grade': '6 a 7 años',
  'Second Grade': '8 a 9 años',
  'Third Grade': '10 a 11 años',
  'Fourth Grade': '12 a 13 años',
  'Third Year': 'desde 14 años',
};

/**
 * Retorna información detallada del curso asignado por edad.
 */
export const getCourseMetaByAge = (age) => {
  const name = getCourseNameByAge(age);
  if (!name) return null;
  return { name, bracket: BRACKETS[name], schedule: SCHEDULES[name] };
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
