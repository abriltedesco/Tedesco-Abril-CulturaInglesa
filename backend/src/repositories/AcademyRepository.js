import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Curso } from '../models/AcademyModels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/academy_state.json');

const defaultCourses = [
    new Curso(2,  { name: 'Kids',                  level: 'Kids',                  minAge: 4,  maxAge: 5,  capacity: 30, schedule: 'Martes y jueves 17:00 a 18:00',   days: ['Martes','Jueves'],   startTime: '17:00', endTime: '18:00' }),
    new Curso(3,  { name: 'First Grade',           level: 'First Grade',           minAge: 6,  maxAge: 7,  capacity: 30, schedule: 'Lunes y miércoles 17:00 a 18:00', days: ['Lunes','Miércoles'], startTime: '17:00', endTime: '18:00', prerequisiteLevel: 'Kids' }),
    new Curso(4,  { name: 'Second Grade',          level: 'Second Grade',          minAge: 8,  maxAge: 9,  capacity: 30, schedule: 'Martes y jueves 17:00 a 18:00',   days: ['Martes','Jueves'],   startTime: '17:00', endTime: '18:00', prerequisiteLevel: 'First Grade' }),
    new Curso(5,  { name: 'Third Grade',           level: 'Third Grade',           minAge: 10, maxAge: 11, capacity: 30, schedule: 'Lunes y miércoles 17:00 a 18:00', days: ['Lunes','Miércoles'], startTime: '17:00', endTime: '18:00', prerequisiteLevel: 'Second Grade' }),
    new Curso(6,  { name: 'Fourth Grade',          level: 'Fourth Grade',          minAge: 12, maxAge: 13, capacity: 30, schedule: 'Martes y jueves 17:00 a 18:00',   days: ['Martes','Jueves'],   startTime: '17:00', endTime: '18:00', prerequisiteLevel: 'Third Grade' }),
    new Curso(7,  { name: 'Third Year',            level: 'Third Year',            minAge: 14, maxAge: 99, capacity: 30, schedule: 'Lunes y miércoles 17:30 a 18:30', days: ['Lunes','Miércoles'], startTime: '17:30', endTime: '18:30' }),
    new Curso(8,  { name: 'Fourth Year',           level: 'Fourth Year',           minAge: 14, maxAge: 99, capacity: 30, schedule: 'Martes y jueves 18:00 a 19:00',   days: ['Martes','Jueves'],   startTime: '18:00', endTime: '19:00' }),
    new Curso(9,  { name: 'Fifth Year',            level: 'Fifth Year',            minAge: 14, maxAge: 99, capacity: 30, schedule: 'Lunes y miércoles 17:30 a 18:30', days: ['Lunes','Miércoles'], startTime: '17:30', endTime: '18:30' }),
    new Curso(10, { name: 'Sixth Year',            level: 'Sixth Year',            minAge: 14, maxAge: 99, capacity: 30, schedule: 'Martes y jueves 18:00 a 19:00',   days: ['Martes','Jueves'],   startTime: '18:00', endTime: '19:00' }),
    new Curso(11, { name: 'Pre First Certificate', level: 'Pre First Certificate', minAge: 14, maxAge: 99, capacity: 30, schedule: 'Lunes y miércoles 19:00 a 20:00', days: ['Lunes','Miércoles'], startTime: '19:00', endTime: '20:00' }),
    new Curso(12, { name: 'First Certificate',     level: 'First Certificate',     minAge: 14, maxAge: 99, capacity: 30, schedule: 'Martes y jueves 19:00 a 20:00',   days: ['Martes','Jueves'],   startTime: '19:00', endTime: '20:00' }),
];

// Cursos del esquema anterior y su equivalente en el nuevo listado
const legacyCourseNames = {
    'inicial 1': 'Kids',
    'inicial 2': 'Second Grade',
    'adolescentes 1': 'Fourth Grade',
    'adolescentes 2': 'Third Year',
    'adultos 1': 'Fifth Year',
    'adultos 2': 'Pre First Certificate',
};

const defaultUsers = [
    {
        id: 1,
        nombre: 'Admin',
        apellido: 'Cultura',
        email: process.env.ADMIN_EMAIL || 'admin@culturainglesa.com',
        // contraseña hasheada se genera en el primer arranque (ver AuthController)
        password: process.env.ADMIN_PASSWORD || 'admin123',
        passwordHashed: false,
        rol: 'ADMIN',
        dni: '00000000',
        telefono: '1161802607',
        estado: 'ACTIVO',
    }
];

let state = {
    users: [...defaultUsers],
    cursos: [...defaultCourses],
    inscripciones: [],
    calificaciones: [],
    asistencias: [],
    pagos: [],
    pagosDocentes: [],
    anuncios: [],
    contactos: [],
};

let nextId = 13;

const loadState = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.state) {
                state = parsed.state;
                nextId = parsed.nextId || 8;
                // Garantizar arrays nuevos que pueden faltar en estados guardados viejos
                if (!state.contactos) state.contactos = [];
                if (!state.pagosDocentes) state.pagosDocentes = [];
                delete state.niveladorResultados;
                // Pasar los cursos del esquema anterior al nuevo listado conservando su id
                const levelMap = {};
                state.cursos.forEach((c) => {
                    const newName = legacyCourseNames[(c.name || '').toLowerCase()];
                    if (!newName) return;
                    if (state.cursos.some((o) => o !== c && o.name === newName)) return;
                    const def = defaultCourses.find((dc) => dc.name === newName);
                    levelMap[c.level] = newName;
                    Object.assign(c, { name: def.name, level: def.level, minAge: def.minAge, maxAge: def.maxAge, schedule: def.schedule, days: def.days, startTime: def.startTime, endTime: def.endTime, prerequisiteLevel: def.prerequisiteLevel });
                });
                state.inscripciones.forEach((i) => {
                    if (levelMap[i.level]) i.level = levelMap[i.level];
                    (i.historial || []).forEach((h) => { if (levelMap[h.level]) h.level = levelMap[h.level]; });
                });
                // Asegurar que todos los cursos del listado oficial existan
                defaultCourses.forEach((defCourse) => {
                    const exists = state.cursos.some((c) => c.name.toLowerCase() === defCourse.name.toLowerCase());
                    if (!exists) state.cursos.push({ ...defCourse, id: nextId++ });
                });
                const order = (c) => defaultCourses.findIndex((dc) => dc.name === c.name);
                state.cursos.sort((a, b) => order(a) - order(b));
                // Migrar cursos viejos sin campos estructurados
                state.cursos.forEach((c) => {
                    const def = defaultCourses.find((dc) => dc.name.toLowerCase() === (c.name || '').toLowerCase());
                    if (!c.days || c.days.length === 0) {
                        c.days = def ? def.days : ['Lunes', 'Miércoles'];
                    }
                    if (!c.startTime) {
                        c.startTime = def ? def.startTime : '17:00';
                    }
                    if (!c.endTime) {
                        c.endTime = def ? def.endTime : '18:00';
                    }
                    if (c.prerequisiteLevel === undefined) {
                        c.prerequisiteLevel = def ? def.prerequisiteLevel : null;
                    }
                    if (!c.fechaInicio) c.fechaInicio = '2026-03-02';
                    if (!c.fechaFin) c.fechaFin = '2026-11-27';
                    if (!c.totalClases) c.totalClases = 25;
                    if (!c.cicloLectivo) c.cicloLectivo = '2026';
                    if (c.cicloIniciado === undefined) c.cicloIniciado = false;
                    if (c.cicloFinalizado === undefined) c.cicloFinalizado = false;
                });
                // Migrar inscripciones sin campo passed o cicloLectivo
                state.inscripciones.forEach((i) => {
                    if (i.passed === undefined) i.passed = null;
                    if (!i.level) i.level = null;
                    if (!i.fechaFinalizacion) i.fechaFinalizacion = null;
                    if (!i.cicloLectivo) i.cicloLectivo = '2026';
                    if (i.desaprobadoPorFaltas === undefined) i.desaprobadoPorFaltas = false;
                });
                // Migrar usuarios sin campo contacto_emergencia
                state.users.forEach((u) => {
                    if (u.contactoEmergencia === undefined) u.contactoEmergencia = '';
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
