import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/alumnos.json');

let alumnos = [];

const loadAlumnos = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            alumnos = JSON.parse(raw) || [];
        }
    } catch (e) {
        console.error('Error cargando alumnos persistentes:', e);
        alumnos = [];
    }
};

const saveAlumnos = () => {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(alumnos, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error guardando alumnos persistentes:', e);
    }
};

loadAlumnos();

class AlumnoRepository {
    findAll() {
        return alumnos;
    }

    findById(id) {
        return alumnos.find((alumno) => alumno.id === id);
    }

    existsByEmail(email, excludeId) {
        return alumnos.some((alumno) => alumno.email === email && alumno.id !== excludeId);
    }

    create(alumno) {
        alumnos.push(alumno);
        saveAlumnos();
        return alumno;
    }

    update(id, data) {
        const index = alumnos.findIndex((alumno) => alumno.id === id);
        if (index === -1) {
            return null;
        }
        alumnos[index] = { ...alumnos[index], ...data };
        saveAlumnos();
        return alumnos[index];
    }

    delete(id) {
        const index = alumnos.findIndex((alumno) => alumno.id === id);
        if (index === -1) {
            return false;
        }
        alumnos.splice(index, 1);
        saveAlumnos();
        return true;
    }
}

export default new AlumnoRepository();
