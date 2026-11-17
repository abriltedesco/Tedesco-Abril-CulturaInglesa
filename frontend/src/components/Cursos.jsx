import React from 'react';
import { CursoCard } from './CursoCard';
import { Reveal } from './Reveal';
import ninosImg from '../assets/clasesNinos.png';
import adolescentesImg from '../assets/clasesAdolescentes.png';
import adultosImg from '../assets/clasesAdultos.png';

const cursosData = [
  {
    id: 'inicial',
    title: 'Inicial',
    image: ninosImg,
    description: 'Para los más chicos: se agrupan por edad en rangos de 2 años y avanzan grado a grado. Queremos que crezcan con nosotros y que sea su segundo hogar.',
    levels: ['Kids', 'First Grade', 'Second Grade', 'Third Grade', 'Fourth Grade'],
    schedules: ['martes y jueves - 17 a 18hs'],
  },
  {
    id: 'years',
    title: 'Years',
    image: adolescentesImg,
    description: 'Desde Third Year el nivel no depende de la edad sino de lo que ya sabés: cursás el año que se ajusta a tu conocimiento.',
    levels: ['Third Year', 'Fourth Year', 'Fifth Year', 'Sixth Year'],
    schedules: ['lunes y miércoles - 17.30 a 18.30hs', 'martes y jueves - 18 a 19hs'],
  },
  {
    id: 'certificados',
    title: 'Certificados',
    image: adultosImg,
    description: 'Preparación para exámenes internacionales. Se pueden rendir a cualquier edad, según tu nivel.',
    levels: ['Pre First Certificate', 'First Certificate'],
    schedules: ['lunes y miércoles - 19 a 20hs', 'martes y jueves - 19 a 20hs'],
  },
];

export const Cursos = () => (
  <section id="cursos" aria-labelledby="cursos-title" style={{ padding: '100px 0', backgroundColor: '#FEF7ED' }}>
    <div className="container">
      <Reveal style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2
          id="cursos-title"
          className="section-title"
          style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: '#273C2C', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}
        >
          NUESTROS CURSOS
        </h2>
        <p style={{ fontSize: '1.02rem', color: '#4A554A', maxWidth: '640px', margin: '0 auto' }}>
          Clases presenciales en grupos reducidos y con seguimiento personalizado.
        </p>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',       gap: '28px', alignItems: 'stretch' }}>
        {cursosData.map((curso, index) => (
                <Reveal key={curso.id} delay={index * 160} style={{ display: 'flex' }}>
            <CursoCard {...curso} index={index} />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
