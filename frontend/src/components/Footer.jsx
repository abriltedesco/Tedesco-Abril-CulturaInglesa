import React from 'react';
import logoImg from '../assets/logo.jpg';
import { Instagram, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#FEF7ED',
        borderTop: '1.5px solid #273C2C',
        padding: '50px 20px 30px 20px',
        textAlign: 'center',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Shield Logo */}
        <img
          src={logoImg}
          alt="Logo Cultural Inglesa de Oxford"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '10px',
            border: '1.5px solid #273C2C',
            objectFit: 'cover',
          }}
        />

        {/* Institution Title */}
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#273C2C',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          CULTURAL INGLESA DE OXFORD
        </h2>

        {/* Address */}
        <p
          style={{
            fontSize: '0.92rem',
            color: '#273C2C',
            fontWeight: 500,
          }}
        >
          Av. Salvador María Del Carril 2568, Villa Pueyrredón
        </p>

        {/* Social Icons */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
          <a
            href="https://instagram.com/laculturalinglesadeoxford"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Cultural Inglesa de Oxford"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1.5px solid #273C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#273C2C',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F3A60';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#1F3A60';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#273C2C';
              e.currentTarget.style.borderColor = '#273C2C';
            }}
          >
            <Instagram size={20} />
          </a>

          <a
            href="https://wa.me/5491161802607"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp de Cultural Inglesa de Oxford"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1.5px solid #273C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#273C2C',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F3A60';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#1F3A60';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#273C2C';
              e.currentTarget.style.borderColor = '#273C2C';
            }}
          >
            <Phone size={20} />
          </a>
        </div>

        {/* Footer legal / copyright */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(39, 60, 44, 0.15)', width: '100%', maxWidth: '600px' }}>
          <p style={{ fontSize: '0.8rem', color: '#6A786B' }}>
            © {new Date().getFullYear()} Cultural Inglesa de Oxford. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
