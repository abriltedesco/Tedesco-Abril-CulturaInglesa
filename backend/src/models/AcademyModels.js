export class Curso {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.level = data.level;
        this.capacity = data.capacity;
        // Horario como string legible (para mostrar)
        this.schedule = data.schedule || '';
        // Horarios estructurados para RN-05
        this.days = Array.isArray(data.days) ? data.days : [];
        this.startTime = data.startTime || '';
        this.endTime = data.endTime || '';
        // Rango de edad y correlatividad
        this.minAge = data.minAge || 0;
        this.maxAge = data.maxAge || 99;
        this.prerequisiteLevel = data.prerequisiteLevel || null;
        // Docente asignado
        this.teacherId = data.teacherId || undefined;
        // Ciclo lectivo y calendario académico
        this.cicloLectivo = data.cicloLectivo || '2026';
        this.fechaInicio = data.fechaInicio || '2026-03-02';
        this.fechaFin = data.fechaFin || '2026-11-27';
        this.totalClases = Number(data.totalClases) || 25;
        this.cicloIniciado = Boolean(data.cicloIniciado);
        this.cicloFinalizado = Boolean(data.cicloFinalizado);
    }
}

export class Inscripcion {
    constructor(id, alumnoId, cursoId, data = {}) {
        this.id = id;
        this.alumnoId = alumnoId;
        this.cursoId = cursoId;
        this.estado = data.estado || 'PENDIENTE';
        this.fecha = data.fecha || new Date().toISOString();
        this.level = data.level || null;
        this.cicloLectivo = data.cicloLectivo || '2026';
        // Se establece al pasar a FINALIZADA
        this.passed = data.passed ?? null;
        this.fechaFinalizacion = data.fechaFinalizacion || null;
        this.porcentajeAsistencia = data.porcentajeAsistencia ?? null;
        this.desaprobadoPorFaltas = Boolean(data.desaprobadoPorFaltas);
    }
}

export class Calificacion {
    constructor(id, inscripcionId, teacherId, value, period, metadata = {}) {
        this.id = id;
        this.inscripcionId = inscripcionId;
        this.teacherId = teacherId;
        this.value = value;
        this.period = period;
        this.name = metadata.name || period || 'Evaluación';
        this.description = metadata.description || '';
        this.date = metadata.date || new Date().toISOString().slice(0, 10);
        this.createdAt = new Date().toISOString();
    }
}

export class Asistencia {
    constructor(id, inscripcionId, teacherId, date, present) {
        this.id = id;
        this.inscripcionId = inscripcionId;
        this.teacherId = teacherId;
        this.date = date;
        this.present = present;
        this.createdAt = new Date().toISOString();
    }
}

export class Contacto {
    constructor(id, data) {
        this.id = id;
        this.nombre = data.nombre || '';
        this.email = data.email || '';
        this.telefono = data.telefono || '';
        this.mensaje = data.mensaje || '';
        this.leido = false;
        this.fecha = new Date().toISOString();
    }
}
