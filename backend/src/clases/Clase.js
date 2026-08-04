class Clase {
    constructor(id, nombre, nivel, profesor, horario, capacidadMaxima) {
        this.id = id;
        this.nombre = nombre;
        this.nivel = nivel;
        this.profesor = profesor;
        this.horario = horario;
        this.capacidadMaxima = capacidadMaxima;
        this.inscripciones = [];
    }
}

export default Clase;
