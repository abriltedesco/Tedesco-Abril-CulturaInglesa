export class Curso {
    constructor(id, data) {
        Object.assign(this, { id, ...data, inscripciones: [] });
    }
}

export class Inscripcion {
    constructor(id, alumnoId, cursoId) {
        Object.assign(this, { id, alumnoId, cursoId, estado: 'PENDIENTE', fecha: new Date().toISOString() });
    }
}

export class Calificacion {
    constructor(id, inscripcionId, teacherId, value, period, metadata = {}) {
        Object.assign(this, { id, inscripcionId, teacherId, value, period, name: metadata.name || period || 'Evaluación', description: metadata.description || '', date: metadata.date || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() });
    }
}

export class Asistencia {
    constructor(id, inscripcionId, teacherId, date, present) {
        Object.assign(this, { id, inscripcionId, teacherId, date, present });
    }
}
