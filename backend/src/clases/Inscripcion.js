class Inscripcion {
    constructor(id, alumno, curso, fechaInscripcion, estado) {
        this.id = id;
        this.alumno = alumno;
        this.curso = curso;
        this.fechaInscripcion = fechaInscripcion;
        this.estado = estado;
        this.pagos = [];
    }
}

export default Inscripcion;
