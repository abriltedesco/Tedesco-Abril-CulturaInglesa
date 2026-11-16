import academy, { id, saveState } from '../repositories/AcademyRepository.js';
import { Contacto } from '../models/AcademyModels.js';
import { successResponse, errorResponse } from '../responses/ApiResponse.js';
import { assertEmail } from '../utils/reglasNegocio.js';

class ContactoController {
    enviar = (req, res) => {
        const { nombre, email, telefono, mensaje } = req.body || {};

        if (!nombre || !String(nombre).trim()) {
            return errorResponse(res, 'El nombre es obligatorio.', 400);
        }
        if (!mensaje || !String(mensaje).trim()) {
            return errorResponse(res, 'El mensaje es obligatorio.', 400);
        }
        try {
            assertEmail(email);
        } catch {
            return errorResponse(res, 'El email ingresado no es válido.', 400);
        }

        const nuevoContacto = new Contacto(id(), {
            nombre: String(nombre).trim(),
            email: String(email).trim().toLowerCase(),
            telefono: String(telefono || '').trim(),
            mensaje: String(mensaje).trim(),
        });

        academy.contactos = academy.contactos || [];
        academy.contactos.push(nuevoContacto);
        saveState();

        return successResponse(res, {
            mensaje: '¡Gracias por contactarte! Nos comunicaremos a la brevedad.',
            contactoId: nuevoContacto.id
        }, 201);
    };
}

export default new ContactoController();
