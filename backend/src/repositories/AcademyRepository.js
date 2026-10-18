const state = {
    users: [{ id: 1, email: process.env.ADMIN_EMAIL || 'admin@culturainglesa.com', password: process.env.ADMIN_PASSWORD || 'admin123', rol: 'ADMIN' }],
    cursos: [], inscripciones: [], calificaciones: [], asistencias: [], pagos: [], anuncios: [],
};

let nextId = 2;
export const id = () => nextId++;
export default state;
