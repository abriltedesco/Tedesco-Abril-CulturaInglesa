import React from 'react';
import foto1 from '../assets/fotos-02.webp';
import foto2 from '../assets/fotos-03.webp';
import foto3 from '../assets/fotos-05.webp';
import foto4 from '../assets/fotos_mas40-02.webp';
import foto5 from '../assets/fotos_mas40-03.webp';
import foto6 from '../assets/fotos_mas40-04.webp';

const FOTOS = [foto1, foto2, foto3, foto4, foto5, foto6];

export const Galeria = () => (
  <section id="galeria" aria-labelledby="galeria-title" className="galeria-section">
    <div className="container" style={{ textAlign: 'center', marginBottom: '48px' }}>
      <h2
        id="galeria-title"
        className="section-title"
        style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: '#273C2C', letterSpacing: '1px', textTransform: 'uppercase' }}
      >
        GALERÍA
      </h2>
    </div>

    <div className="galeria-viewport">
      <div className="galeria-track" style={{ display: 'flex', width: 'max-content' }}>
        {[...FOTOS, ...FOTOS].map((src, i) => (
          <div className="galeria-item" key={i} aria-hidden={i >= FOTOS.length || undefined}>
            <img src={src} alt={i < FOTOS.length ? `Momentos en la institución ${i + 1}` : ''} />
          </div>
        ))}
      </div>
    </div>
  </section>
);
