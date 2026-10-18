import React from 'react';
import heroImg from '../assets/hero.jpg';

export const Hero = () => {
  return (
    <section
      aria-label="Presentación principal"
      style={{
        position: 'relative',
        height: '75vh',
        minHeight: '480px',
        maxHeight: '650px',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(${heroImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        textAlign: 'center',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          maxWidth: '850px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: 1.15,
            textShadow: '0 3px 12px rgba(0,0,0,0.6)',
          }}
        >
          MÁS INGLES,<br />
          MÁS OPORTUNIDADES
        </h1>

        <a
          href="#contacto"
          style={{
            backgroundColor: '#1F3A60',
            color: '#FFFFFF',
            padding: '14px 44px',
            borderRadius: '12px',
            fontSize: '1.05rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            transition: 'all 0.25s ease',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#172D4C';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1F3A60';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Contactános
        </a>
      </div>
    </section>
  );
};
