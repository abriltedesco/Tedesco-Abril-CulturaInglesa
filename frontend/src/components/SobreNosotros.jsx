import React from 'react';
import sobreNosotrosImg from '../assets/sobrenosotros.png';

export const SobreNosotros = () => {
  return (
    <section id="sobre-nosotros" aria-labelledby="sobre-nosotros-title" style={{ padding: '80px 0', backgroundColor: '#FEF7ED' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px',
            alignItems: 'center',
          }}
        >
          {/* Left Column Image */}
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(39, 60, 44, 0.1)',
              border: '1px solid rgba(39, 60, 44, 0.2)',
            }}
          >
            <img
              src={sobreNosotrosImg}
              alt="Estudiantes en el aula de Cultura Inglesa de Oxford"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Right Column Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2
              id="sobre-nosotros-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#273C2C',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              SOBRE NOSOTROS
            </h2>

            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#273C2C',
              }}
            >
              La educación nos abre las puertas al mundo
            </h3>

            <p
              style={{
                fontSize: '0.95rem',
                color: '#273C2C',
                lineHeight: '1.7',
              }}
            >
              En Cultura Inglesa de Oxford contamos con más de cuatro décadas de trayectoria formando estudiantes con absoluta seriedad y compromiso. Acompañamos a alumnos de todas las edades a través de un enfoque humano e integral. Creemos que la clave del éxito es aprender en un ambiente cálido y de confianza. Por eso, combinamos un seguimiento personalizado con metodologías dinámicas y actualizadas que hacen que nuestros estudiantes realmente disfruten el proceso de aprendizaje.
              Nuestro compromiso se refleja en los resultados: apostamos fuertemente a la preparación para exámenes internacionales y nos enorgullece contar con un 100% de alumnos aprobados en el First Certificate (FCE).
            </p>

            <div style={{ marginTop: '10px' }}>
              <h4
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#273C2C',
                  marginBottom: '8px',
                }}
              >
                Nuestro Equipo
              </h4>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: '#273C2C',
                  lineHeight: '1.7',
                }}
              >
                El corazón de nuestra institución son nuestras docentes, Gabriela y Patricia. Conforman un equipo académico excepcional, reconocido constantemente por nuestros alumnos y familias gracias a su gran nivel de profesionalismo, su paciencia y, sobre todo, su inmensa pasión por la enseñanza.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
