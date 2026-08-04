import Persona from './Persona.js';

class Alumno extends Persona {
    constructor(id, nombre, apellido, email, telefono, fechaNacimiento, nivel) {
        super(id, nombre, apellido, email, telefono);
        this.fechaNacimiento = fechaNacimiento;
        this.nivel = nivel;
        this.inscripciones = [];
        this.pagos = [];
    }

}

export default Alumno;
