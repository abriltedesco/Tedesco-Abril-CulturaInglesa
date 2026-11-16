import { BadRequestError, ConflictError } from '../exceptions/AppError.js';

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const assertEmail = (email) => {
    if (!emailPattern.test(email || '')) throw new BadRequestError('El email no tiene un formato válido.');
};

export const assertDni = (dni) => {
    if (!/^\d+$/.test(String(dni || ''))) throw new BadRequestError('El DNI debe contener únicamente números.');
};

export const assertMinimumAge = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) throw new BadRequestError('La fecha de nacimiento no es válida.');
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())) age--;
    if (age < 4) throw new BadRequestError('El alumno debe tener al menos 4 años.');
};

export const assertUnique = (items, field, value, message) => {
    if (items.some((item) => String(item[field]).toLowerCase() === String(value).toLowerCase())) throw new ConflictError(message);
};

/**
 * RN-05: Detecta superposición de horarios entre dos cursos.
 * Cada curso debe tener days[], startTime (HH:MM) y endTime (HH:MM).
 */
const timeToMinutes = (t) => {
    const [h, m] = String(t || '00:00').split(':').map(Number);
    return h * 60 + (m || 0);
};

export const overlaps = (cursoA, cursoB) => {
    if (!cursoA.days?.length || !cursoB.days?.length) return false;
    const sharedDay = cursoA.days.some((d) => cursoB.days.includes(d));
    if (!sharedDay) return false;
    const aStart = timeToMinutes(cursoA.startTime);
    const aEnd = timeToMinutes(cursoA.endTime);
    const bStart = timeToMinutes(cursoB.startTime);
    const bEnd = timeToMinutes(cursoB.endTime);
    return aStart < bEnd && bStart < aEnd;
};
