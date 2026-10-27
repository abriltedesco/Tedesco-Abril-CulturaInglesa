import React, { useState } from 'react';
import logoImg from '../assets/logo.jpg';
import { Menu, X, LogIn } from 'lucide-react';

export const Navbar = ({ onOpenLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'CURSOS', href: '#cursos' },
    { name: 'SOBRE NOSOTROS', href: '#sobre-nosotros' },
    { name: 'PREGUNTAS FRECUENTES', href: '#preguntas-frecuentes' },
    { name: 'CONTACTO', href: '#contacto' },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        backgroundColor: '#FEF7ED',
        borderBottom: '1px solid rgba(39, 60, 44, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        {/* Brand Logo & Name */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textDecoration: 'none',
          }}
          aria-label="Cultural Inglesa de Oxford - Inicio"
        >
          <img
            src={logoImg}
            alt="Logo Cultural Inglesa de Oxford"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '6px',
              objectFit: 'cover',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#273C2C',
              letterSpacing: '0.5px',
              maxWidth: '220px',
              lineHeight: '1.2',
            }}
          >
            CULTURAL INGLESA DE OXFORD
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav aria-label="Navegación principal" className="desktop-nav">
          <ul
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              listStyle: 'none',
            }}
          >
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={handleNavClick}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: '#273C2C',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#1F3A60')}
                  onMouseLeave={(e) => (e.target.style.color = '#273C2C')}
                >
                  {link.name}
                </a>
              </li>
            ))}

            {/* Portal Direct access button for Backend API Integration */}
            <li>
              <button
                onClick={onOpenLogin}
                style={{
                  backgroundColor: '#1F3A60',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(31, 58, 96, 0.2)',
                }}
                aria-label="Abrir gestión de alumnos"
              >
                <LogIn size={16} />
                INGRESAR
              </button>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          style={{
            display: 'none',
            padding: '8px',
            color: '#273C2C',
          }}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#FEF7ED',
            borderBottom: '2px solid #273C2C',
            padding: '16px 24px 24px 24px',
          }}
        >
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={handleNavClick}
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#273C2C',
                    display: 'block',
                  }}
                >
                  {link.name}
                </a>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  handleNavClick();
                  onOpenLogin();
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1F3A60',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <LogIn size={18} />
                INGRESAR
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Responsive Style block for mobile nav */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};
