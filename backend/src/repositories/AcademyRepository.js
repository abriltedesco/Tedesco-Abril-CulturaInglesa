import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Curso } from '../models/AcademyModels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/academy_state.json');

const defaultCourses = [
    new Curso(2, { name: 'Inicial 1', level: 'Inicial 1', minAge: 4, maxAge: 6, capacity: 30, schedule: 'Martes y jueves 17:00 a 18:00' }),
    new Curso(3, { name: 'Inicial 2', level: 'Inicial 2', minAge: 7, maxAge: 10, capacity: 30, schedule: 'Martes y jueves 17:00 a 18:00' }),
    new Curso(4, { name: 'Adolescentes 1', level: 'Adolescentes 1', minAge: 11, maxAge: 13, capacity: 30, schedule: 'Lunes y miércoles 17:30 a 18:30' }),
    new Curso(5, { name: 'Adolescentes 2', level: 'Adolescentes 2', minAge: 14, maxAge: 17, capacity: 30, schedule: 'Martes y jueves 18:00 a 19:00' }),
    new Curso(6, { name: 'Adultos 1', level: 'Adultos 1', minAge: 18, maxAge: 30, capacity: 30, schedule: 'Lunes y miércoles 19:00 a 20:00' }),
    new Curso(7, { name: 'Adultos 2', level: 'Adultos 2', minAge: 31, maxAge: 99, capacity: 30, schedule: 'Martes y jueves 19:00 a 20:00' }),
];

const defaultUsers = [
    {
        id: 1,
        nombre: 'Admin',
        apellido: 'Cultura',
        email: process.env.ADMIN_EMAIL || 'admin@culturainglesa.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        rol: 'ADMIN',
        dni: '00000000',
        telefono: '1161802607',
        estado: 'ACTIVO'
    }
];

let state = {
    users: [...defaultUsers],
    cursos: [...defaultCourses],
    inscripciones: [],
    calificaciones: [],
    asistencias: [],
    pagos: [],
    anuncios: [],
};

let nextId = 8;

const loadState = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.state) {
                state = parsed.state;
                nextId = parsed.nextId || 8;
                // Asegurar que todos los 6 cursos obligatorios existan
                defaultCourses.forEach((defCourse) => {
                    const exists = state.cursos.some((c) => c.name.toLowerCase() === defCourse.name.toLowerCase());
                    if (!exists) {
                        state.cursos.push(defCourse);
                    }
                });
                return;
            }
        }
    } catch (e) {
        console.error('Error cargando estado persistente, usando valores por defecto:', e);
    }
    saveState();
};

export const saveState = () => {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify({ state, nextId }, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error guardando estado persistente:', e);
    }
};

loadState();

export const id = () => {
    const generated = nextId++;
    saveState();
    return generated;
};

export default state;
