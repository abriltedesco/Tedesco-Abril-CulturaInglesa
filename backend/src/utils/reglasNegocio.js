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

export const overlaps = (a, b) => a.day === b.day && a.start < b.end && b.start < a.end;
