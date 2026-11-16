import React, { useState, useEffect } from 'react';
import { niveladorService } from '../services/niveladorService';
import { CheckCircle2, Award, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

const FALLBACK_PREGUNTAS = [
  { id: 1, pregunta: "What ___ your name?", opciones: ["is", "are", "am", "be"], nivel: "Inicial 1", puntaje: 1, correcta: 0 },
  { id: 2, pregunta: "She ___ a teacher.", opciones: ["is", "are", "am", "be"], nivel: "Inicial 1", puntaje: 1, correcta: 0 },
  { id: 3, pregunta: "How many ___ are there in the room?", opciones: ["chair", "chairs", "chairing", "chaired"], nivel: "Inicial 1", puntaje: 1, correcta: 1 },
  { id: 4, pregunta: "I ___ breakfast every morning.", opciones: ["have", "has", "having", "had"], nivel: "Inicial 2", puntaje: 2, correcta: 0 },
  { id: 5, pregunta: "They ___ to school yesterday.", opciones: ["go", "went", "goes", "going"], nivel: "Inicial 2", puntaje: 2, correcta: 1 },
  { id: 6, pregunta: "She ___ been working here for three years.", opciones: ["has", "have", "had", "is"], nivel: "Adolescentes 1", puntaje: 3, correcta: 0 },
  { id: 7, pregunta: "If I ___ more time, I would study harder.", opciones: ["have", "had", "has", "would have"], nivel: "Adolescentes 1", puntaje: 3, correcta: 1 },
  { id: 8, pregunta: "By the time she arrived, they ___ already left.", opciones: ["had", "have", "were", "would"], nivel: "Adolescentes 2", puntaje: 4, correcta: 0 },
  { id: 9, pregunta: "He suggested ___ the project before the deadline.", opciones: ["finish", "to finish", "finishing", "finished"], nivel: "Adolescentes 2", puntaje: 4, correcta: 2 },
  { id: 10, pregunta: "Despite ___ hard, she didn't pass the exam.", opciones: ["study", "studying", "studied", "to study"], nivel: "Adultos 1", puntaje: 5, correcta: 1 },
  { id: 11, pregunta: "The report ___ by the committee before it was published.", opciones: ["reviewed", "was reviewed", "has reviewed", "reviewing"], nivel: "Adultos 1", puntaje: 5, correcta: 1 },
  { id: 12, pregunta: "Had she known about the meeting, she ___ attended.", opciones: ["would", "would have", "had", "will have"], nivel: "Adultos 2", puntaje: 6, correcta: 1 }
];

export const TestNivelador = ({ showToast }) => {
  const [step, setStep] = useState('intro'); // 'intro' | 'test' | 'result'
  const [preguntas, setPreguntas] = useState(FALLBACK_PREGUNTAS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [userData, setUserData] = useState({ nombre: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    niveladorService.getPreguntas()
      .then((data) => {
        if (data && data.length > 0) {
          setPreguntas(data);
        }
      })
      .catch((err) => {
        console.warn('Usando preguntas offline del test nivelador:', err);
      });
  }, []);

  const handleStart = (e) => {
    e.preventDefault();
    if (!userData.nombre.trim()) {
      showToast('error', 'Por favor ingresá tu nombre completo.');
      return;
    }
    if (!userData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      showToast('error', 'Por favor ingresá un correo electrónico válido.');
      return;
    }
    setCurrentIndex(0);
    setRespuestas({});
    setStep('test');
  };

  const handleSelectOpcion = (opcionIndex) => {
    const currentPregunta = preguntas[currentIndex];
    setRespuestas((prev) => ({
      ...prev,
      [currentPregunta.id]: opcionIndex,
    }));
  };

  const handleNext = () => {
    const currentPregunta = preguntas[currentIndex];
    if (respuestas[currentPregunta.id] === undefined) {
      showToast('error', 'Seleccioná una respuesta para continuar.');
      return;
    }
    if (currentIndex < preguntas.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      enviarTest();
    }
  };

  const calcularResultadoLocal = (respMap) => {
    let puntaje = 0;
    let aciertos = 0;
    FALLBACK_PREGUNTAS.forEach((p) => {
      const resp = respMap[p.id];
      if (resp !== undefined && resp === p.correcta) {
        puntaje += p.puntaje;
        aciertos++;
      }
    });

    let nivelSugerido = 'Inicial 1';
    let recomendacion = 'Te recomendamos comenzar con nuestro curso Inicial 1 para asentar bases sólidas.';
    if (puntaje >= 26) {
      nivelSugerido = 'Adultos 2';
      recomendacion = 'Excelente dominio del idioma. Estás listo para cursadas avanzadas o preparación de exámenes internacionales.';
    } else if (puntaje >= 18) {
      nivelSugerido = 'Adultos 1';
      recomendacion = 'Nivel intermedio-alto. Tenés fluidez en estructuras complejas y vocabulario amplio.';
    } else if (puntaje >= 12) {
      nivelSugerido = 'Adolescentes 2';
      recomendacion = 'Nivel intermedio consolidado. Podés desenvolverte en la mayoría de situaciones cotidianas.';
    } else if (puntaje >= 7) {
      nivelSugerido = 'Adolescentes 1';
      recomendacion = 'Nivel pre-intermedio. Comprendés nociones fundamentales de gramática y tiempos verbales.';
    } else if (puntaje >= 4) {
      nivelSugerido = 'Inicial 2';
      recomendacion = 'Nivel elemental. Conocés vocabulario básico y estructuras simples del idioma.';
    }

    return {
      nombre: userData.nombre,
      email: userData.email,
      puntaje,
      totalPreguntas: FALLBACK_PREGUNTAS.length,
      aciertos,
      nivelSugerido,
      recomendacion,
      fecha: new Date().toISOString()
    };
  };

  const enviarTest = async () => {
    setIsLoading(true);
    try {
      const payloadRespuestas = Object.entries(respuestas).map(([preguntaId, opcionSeleccionada]) => ({
        preguntaId: Number(preguntaId),
        opcionSeleccionada: Number(opcionSeleccionada),
      }));

      let res;
      try {
        res = await niveladorService.evaluar({
          nombre: userData.nombre,
          email: userData.email,
          respuestas: payloadRespuestas,
        });
      } catch (errApi) {
        console.warn('Calculando test localmente por desconexión de API:', errApi);
        res = calcularResultadoLocal(respuestas);
      }

      setResultado(res);
      setStep('result');
      showToast('success', '¡Test nivelador evaluado con éxito!');
    } catch (err) {
      showToast('error', err.message || 'Error al procesar el test nivelador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRespuestas({});
    setCurrentIndex(0);
    setResultado(null);
    setStep('intro');
  };

  const currentPregunta = preguntas[currentIndex];
  const progressPercent = preguntas.length > 0 ? Math.round(((currentIndex + 1) / preguntas.length) * 100) : 0;

  return (
    <section id="test-nivelador" style={{ padding: '80px 0', background: '#FEF7ED', borderTop: '1.5px solid rgba(39,60,44,0.15)' }}>
      <div className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>
        
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FAF3E8', color: '#1F3A60', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, border: '1px solid rgba(39,60,44,0.15)' }}>
            <Sparkles size={16} />
            EVALUACIÓN ONLINE GRATUITA
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#273C2C', margin: '0 0 10px 0' }}>
            Test Nivelador Interactivo
          </h2>
          <p style={{ color: '#4A554A', fontSize: '0.98rem', maxWidth: 560, margin: '0 auto' }}>
            Conocé tu nivel de inglés en solo 5 minutos y recibí la recomendación del curso ideal para tus objetivos.
          </p>
        </div>

        {/* PASO 1: Formulario inicial */}
        {step === 'intro' && (
          <div style={{ background: '#FAF3E8', border: '1.5px solid rgba(39,60,44,0.22)', borderRadius: 20, padding: '36px 28px', boxShadow: '0 8px 24px rgba(39,60,44,0.06)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', fontSize: '1.3rem', marginBottom: 8 }}>
              Antes de comenzar
            </h3>
            <p style={{ color: '#687768', fontSize: '0.9rem', marginBottom: 22 }}>
              Ingresá tus datos para que podamos registrar tu resultado y brindarte asesoramiento personalizado.
            </p>

            <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#273C2C', marginBottom: 6 }}>
                  Nombre y apellido *
                </label>
                <input
                  type="text"
                  required
                  value={userData.nombre}
                  onChange={(e) => setUserData((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Clara Gómez"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(39,60,44,0.25)', background: '#FEF7ED', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#273C2C', marginBottom: 6 }}>
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@correo.com"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(39,60,44,0.25)', background: '#FEF7ED', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#FEF7ED', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(39,60,44,0.15)', fontSize: '0.85rem', color: '#4A554A', marginTop: 4 }}>
                <strong>Instrucciones:</strong> El test contiene 12 preguntas de opción múltiple que incrementan progresivamente su dificultad. Respondé con sinceridad sin utilizar traductores para obtener un resultado certero.
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 10,
                  background: '#1F3A60',
                  color: '#FFFFFF',
                  padding: '14px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(31,58,96,0.25)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Comenzar evaluación <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* PASO 2: Pregunta actual del test */}
        {step === 'test' && currentPregunta && (
          <div style={{ background: '#FAF3E8', border: '1.5px solid rgba(39,60,44,0.22)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 8px 24px rgba(39,60,44,0.06)' }}>
            
            {/* Barra de progreso */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#1F3A60', marginBottom: 6 }}>
                <span>Pregunta {currentIndex + 1} de {preguntas.length}</span>
                <span>{progressPercent}% completado</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#EAE1D3', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#1F3A60', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Enunciado de la pregunta */}
            <div style={{ background: '#FEF7ED', padding: '18px 20px', borderRadius: 14, border: '1px solid rgba(39,60,44,0.18)', marginBottom: 20 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#687768', letterSpacing: '0.5px' }}>
                Nivel estimado: {currentPregunta.nivel}
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#273C2C', margin: '8px 0 0 0', lineHeight: 1.35 }}>
                {currentPregunta.pregunta}
              </h3>
            </div>

            {/* Opciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentPregunta.opciones.map((opcion, idx) => {
                const isSelected = respuestas[currentPregunta.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOpcion(idx)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: `2px solid ${isSelected ? '#1F3A60' : 'rgba(39,60,44,0.18)'}`,
                      background: isSelected ? '#FEF7ED' : '#FAF3E8',
                      color: isSelected ? '#1F3A60' : '#273C2C',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.98rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(31,58,96,0.12)' : 'none',
                    }}
                  >
                    <span>{opcion}</span>
                    {isSelected && <CheckCircle2 size={20} color="#1F3A60" />}
                  </button>
                );
              })}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, paddingTop: 16, borderTop: '1px solid rgba(39,60,44,0.15)' }}>
              <span style={{ fontSize: '0.8rem', color: '#687768' }}>
                Respondé para avanzar
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading || respuestas[currentPregunta.id] === undefined}
                style={{
                  background: '#273C2C',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: respuestas[currentPregunta.id] === undefined ? 'not-allowed' : 'pointer',
                  opacity: respuestas[currentPregunta.id] === undefined ? 0.6 : 1,
                  border: 'none',
                }}
              >
                {isLoading ? 'Evaluando...' : currentIndex < preguntas.length - 1 ? 'Siguiente' : 'Finalizar evaluación'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Resultado */}
        {step === 'result' && resultado && (
          <div style={{ background: '#FAF3E8', border: '2px solid #273C2C', borderRadius: 20, padding: '36px 28px', textAlign: 'center', boxShadow: '0 12px 32px rgba(39,60,44,0.1)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#273C2C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Award size={36} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#273C2C', margin: '0 0 6px 0' }}>
              ¡Felicitaciones, {resultado.nombre}!
            </h3>
            <p style={{ color: '#687768', fontSize: '0.92rem', marginBottom: 24 }}>
              Completaste exitosamente el test de nivelación.
            </p>

            {/* Tarjeta de Nivel Sugerido */}
            <div style={{ background: '#FEF7ED', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(39,60,44,0.18)', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#1F3A60', letterSpacing: '0.5px' }}>
                Nivel Sugerido de Ingreso
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 800, color: '#273C2C', margin: '4px 0 10px 0' }}>
                {resultado.nivelSugerido}
              </div>
              <p style={{ color: '#4A554A', fontSize: '0.92rem', margin: 0, lineHeight: 1.45 }}>
                {resultado.recomendacion}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(39,60,44,0.1)', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ color: '#687768' }}>Aciertos: </span>
                  <strong style={{ color: '#273C2C' }}>{resultado.aciertos} de {resultado.totalPreguntas}</strong>
                </div>
                <div>
                  <span style={{ color: '#687768' }}>Puntaje: </span>
                  <strong style={{ color: '#1F3A60' }}>{resultado.puntaje} pts</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <a
                href="#contacto"
                style={{
                  background: '#1F3A60',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Inscribirme o consultar por este curso
              </a>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'transparent',
                  color: '#4A554A',
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  border: '1.5px solid rgba(39,60,44,0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} /> Realizar otro test
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
