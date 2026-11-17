import React, { useEffect, useState } from 'react';
import heroImg from '../assets/hero.jpg';

const LINES = ['MÁS INGLÉS,', 'MÁS OPORTUNIDADES'];
const FULL_TEXT = LINES.join('\n');

// Escribe el texto caracter por caracter, como si se estuviera tipeando
const useTypewriter = (text, { startDelay = 500, speed = 70 } = {}) => {
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [count, setCount] = useState(reduceMotion ? text.length : 0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    let interval;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, startDelay, speed, reduceMotion]);

  return count;
};

export const Hero = () => {
  const count = useTypewriter(FULL_TEXT);
  const typed = FULL_TEXT.slice(0, count);
  const [first, second = ''] = typed.split('\n');

  return (
    <section
      aria-label="Presentación principal"
      style={{
        position: 'relative',
        minHeight: '88vh',
        maxHeight: '780px',
        backgroundImage: `linear-gradient(rgba(39, 60, 44, 0.78), rgba(39, 60, 44, 0.78)), url(${heroImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        color: '#FEF7ED',
        overflow: 'hidden',
      }}
    >
      <div className="container" style={{ width: '100%', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h1
          aria-label="Más inglés, más oportunidades"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2.2rem, 6.4vw, 5rem)',
            fontWeight: 700,
            color: '#FEF7ED',
            lineHeight: 1.08,
            letterSpacing: '-1px',
            minHeight: '2.2em',
            marginBottom: '34px',
          }}
        >
          <span aria-hidden="true">
            <span style={{ display: 'block' }}>{first}</span>
            <span style={{ display: 'block' }}>
              {second}
              <span className="typewriter-caret" />
            </span>
          </span>
        </h1>

        <p
          className="hero-fade"
          style={{
            animationDelay: '2.6s',
            maxWidth: '520px',
            margin: '0 auto 38px',
            fontSize: '1.1rem',
            lineHeight: 1.7,
            color: 'rgba(254, 247, 237, 0.85)',
          }}
        >
          Clases presenciales en grupos reducidos, desde los primeros pasos hasta los exámenes internacionales.
        </p>

        <div className="hero-fade" style={{ animationDelay: '3s', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#contacto" className="hero-btn hero-btn-primary">Contactanos</a>
          <a href="#cursos" className="hero-btn hero-btn-ghost">Ver cursos ↓</a>
        </div>
      </div>
    </section>
  );
};
