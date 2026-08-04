import Persona from './Persona.js';

class Profesor extends Persona {
    constructor(id, nombre, apellido, email, telefono, especialidad) {
        super(id, nombre, apellido, email, telefono);
        this.especialidad = especialidad;
        this.cursos = [];
    }


}

export default Profesor;
