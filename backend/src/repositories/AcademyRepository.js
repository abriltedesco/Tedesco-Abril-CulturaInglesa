import { Curso } from '../models/AcademyModels.js';

const state = {
    users: [{ id: 1, email: process.env.ADMIN_EMAIL || 'admin@culturainglesa.com', password: process.env.ADMIN_PASSWORD || 'admin123', rol: 'ADMIN' }],
    cursos: [
        new Curso(2, { name: 'Inicial', level: 'Inicial', capacity: 30, schedule: 'Lunes y miércoles 18:00' }),
        new Curso(3, { name: 'Adolescentes', level: 'Adolescentes', capacity: 30, schedule: 'Martes y jueves 18:00' }),
        new Curso(4, { name: 'Adultos', level: 'Adultos', capacity: 30, schedule: 'Lunes y miércoles 20:00' }),
    ], inscripciones: [], calificaciones: [], asistencias: [], pagos: [], anuncios: [],
};

let nextId = 5;
export const id = () => nextId++;
export default state;
