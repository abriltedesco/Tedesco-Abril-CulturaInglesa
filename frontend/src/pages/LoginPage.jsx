import React, { useState } from 'react';
import logoImg from '../assets/logo.jpg';
import { authService } from '../services/authService';
import { ArrowLeft } from 'lucide-react';

export const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await authService.login({ email, password });
      sessionStorage.setItem('authToken', result.token);
      sessionStorage.setItem('authUser', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión. Verificá tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF7ED',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: 'min(480px, 100%)',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(39, 60, 44, 0.15)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 8px 30px rgba(39,60,44,0.08)',
        }}
      >
        {/* Header con Logo oficial sin borde */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <img
            src={logoImg}
            alt="Logo Cultural Inglesa de Oxford"
            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
          />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#273C2C', margin: 0, lineHeight: 1.15 }}>
              CULTURAL INGLESA DE OXFORD
            </h1>
            <span style={{ fontSize: '0.78rem', color: '#687768', fontWeight: 600 }}>
              Acceso al Portal
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: '#FFEBEE',
              color: '#D32F2F',
              padding: '11px 14px',
              borderRadius: 10,
              marginBottom: 18,
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="login-email"
              style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.84rem', color: '#273C2C' }}
            >
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="usuario@ejemplo.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1.5px solid rgba(39,60,44,0.22)',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.84rem', color: '#273C2C' }}
            >
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1.5px solid rgba(39,60,44,0.22)',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              backgroundColor: '#1F3A60',
              color: '#FFFFFF',
              padding: '13px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.96rem',
              marginTop: 6,
              boxShadow: '0 4px 14px rgba(31,58,96,0.25)',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            marginTop: 18,
            padding: '8px',
            color: '#687768',
            fontWeight: 700,
            fontSize: '0.88rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Volver a la página principal
        </button>
      </div>
    </main>
  );
};
