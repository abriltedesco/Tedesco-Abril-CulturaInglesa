import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import academy, { id, saveState } from '../repositories/AcademyRepository.js';
import { NiveladorRespuesta } from '../models/AcademyModels.js';
import { successResponse, errorResponse } from '../responses/ApiResponse.js';
import { assertEmail } from '../utils/reglasNegocio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREGUNTAS_FILE = path.join(__dirname, '../data/nivelador_preguntas.json');

const loadPreguntas = () => {
    try {
        const raw = fs.readFileSync(PREGUNTAS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error cargando preguntas del test nivelador:', e);
        return [];
    }
};

class NiveladorController {
    getPreguntas = (req, res) => {
        const preguntas = loadPreguntas();
        // Ocultar la respuesta correcta en la entrega pública
        const sanitized = preguntas.map(({ id, pregunta, opciones, nivel, puntaje }) => ({
            id,
            pregunta,
            opciones,
            nivel,
            puntaje
        }));
        return successResponse(res, sanitized);
    };

    evaluar = (req, res) => {
        const { nombre, email, respuestas } = req.body || {};
        if (!nombre || !String(nombre).trim()) {
            return errorResponse(res, 'El nombre es obligatorio.', 400);
        }
        try {
            assertEmail(email);
        } catch {
            return errorResponse(res, 'El formato de email no es válido.', 400);
        }

        const preguntas = loadPreguntas();
        let puntajeTotal = 0;
        let aciertos = 0;

        const respuestasMap = new Map();
        if (Array.isArray(respuestas)) {
            respuestas.forEach((r) => {
                if (r && r.preguntaId !== undefined) {
                    respuestasMap.set(Number(r.preguntaId), Number(r.opcionSeleccionada));
                }
            });
        }

        preguntas.forEach((p) => {
            const elegida = respuestasMap.get(p.id);
            if (elegida !== undefined && elegida === p.correcta) {
                puntajeTotal += p.puntaje || 1;
                aciertos++;
            }
        });

        // Determinación del nivel sugerido según puntaje acumulado
        let nivelSugerido = 'Inicial 1';
        let recomendacion = 'Te recomendamos comenzar con nuestro curso Inicial para asentar bases sólidas.';
        if (puntajeTotal >= 26) {
            nivelSugerido = 'Adultos 2';
            recomendacion = 'Excelente dominio del idioma. Estás listo para cursadas avanzadas o preparación de exámenes internacionales.';
        } else if (puntajeTotal >= 18) {
            nivelSugerido = 'Adultos 1';
            recomendacion = 'Nivel intermedio-alto. Tenés fluidez en estructuras complejas y vocabulario amplio.';
        } else if (puntajeTotal >= 12) {
            nivelSugerido = 'Adolescentes 2';
            recomendacion = 'Nivel intermedio consolidado. Podés desenvolverte en la mayoría de situaciones cotidianas.';
        } else if (puntajeTotal >= 7) {
            nivelSugerido = 'Adolescentes 1';
            recomendacion = 'Nivel pre-intermedio. Comprendés nociones fundamentales de gramática y tiempos verbales.';
        } else if (puntajeTotal >= 4) {
            nivelSugerido = 'Inicial 2';
            recomendacion = 'Nivel elemental. Conocés vocabulario básico y estructuras simples del idioma.';
        }

        const registro = new NiveladorRespuesta(id(), {
            nombre: String(nombre).trim(),
            email: String(email).trim().toLowerCase(),
            respuestas: Array.from(respuestasMap.entries()).map(([preguntaId, opcion]) => ({ preguntaId, opcion })),
            puntaje: puntajeTotal,
            nivelSugerido
        });

        academy.niveladorResultados = academy.niveladorResultados || [];
        academy.niveladorResultados.push(registro);
        saveState();

        return successResponse(res, {
            nombre: registro.nombre,
            email: registro.email,
            puntaje: puntajeTotal,
            totalPreguntas: preguntas.length,
            aciertos,
            nivelSugerido,
            recomendacion,
            fecha: registro.fecha
        });
    };
}

export default new NiveladorController();
