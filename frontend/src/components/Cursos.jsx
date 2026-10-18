import React from 'react';
import { CursoCard } from './CursoCard';
import ninosImg from '../assets/clasesNinos.png';
import adolescentesImg from '../assets/clasesAdolescentes.png';
import adultosImg from '../assets/clasesAdultos.png';

export const Cursos = () => {
  const cursosData = [
    {
      id: 'ninos',
      title: 'NIÑOS',
      image: ninosImg,
      description: 'Clases guiadas para los más peques, ofrecemos que crezcan con nosotros y que se convierta su segundo hogar',
      schedules: ['martes y jueves - 17 a 18hs'],
    },
    {
      id: 'adolescentes',
      title: 'ADOLESCENTES',
      image: adolescentesImg,
      description: 'Clases guiadas para chicos apartir de los 12 años hasta los 18, donde se los preparará para rendir exámenes internacionales',
      schedules: ['lunes y miercoles - 17.30 a 18.30hs', 'martes y jueves - 18 a 19hs'],
    },
    {
      id: 'adultos',
      title: 'ADULTOS',
      image: adultosImg,
      description: 'Clases guiadas para quienes quieren profundizar su nivel o aprender desde cero para nutrir su vida profesional',
      schedules: ['lunes y miercoles - 19 a 20hs', 'martes y jueves - 19a 20hs'],
    },
  ];

  return (
    <section id="cursos" aria-labelledby="cursos-title" style={{ padding: '80px 0', backgroundColor: '#FEF7ED' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2
            id="cursos-title"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#273C2C',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            CURSOS
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: '#273C2C',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            Ofrecemos clases presenciales para todas las edades, en grupos reducidos y con seguimiento personalizado.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '30px',
          }}
        >
          {cursosData.map((curso) => (
            <CursoCard key={curso.id} {...curso} />
          ))}
        </div>
      </div>
    </section>
  );
};
