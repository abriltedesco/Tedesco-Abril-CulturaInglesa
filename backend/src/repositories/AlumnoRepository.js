const alumnos = [];

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
        return alumno;
    }

    update(id, data) {
        const index = alumnos.findIndex((alumno) => alumno.id === id);
        if (index === -1) {
            return null;
        }
        alumnos[index] = { ...alumnos[index], ...data };
        return alumnos[index];
    }

    delete(id) {
        const index = alumnos.findIndex((alumno) => alumno.id === id);
        if (index === -1) {
            return false;
        }
        alumnos.splice(index, 1);
        return true;
    }
}

export default new AlumnoRepository();
