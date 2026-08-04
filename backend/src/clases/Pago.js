class Pago {
    constructor(id, inscripcion, monto, fecha, metodoPago, estado) {
        this.id = id;
        this.inscripcion = inscripcion;
        this.monto = monto;
        this.fecha = fecha;
        this.metodoPago = metodoPago;
        this.estado = estado;
    }
}

export default Pago;
