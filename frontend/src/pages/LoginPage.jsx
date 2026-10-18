import React, { useState } from 'react';
import logoImg from '../assets/logo.jpg';
import { authService } from '../services/authService';

export const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try {
      const result = await authService.login({ email, password });
      sessionStorage.setItem('authToken', result.token);
      sessionStorage.setItem('authUser', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) { setError(err.message || 'No se pudo iniciar sesión.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF7ED', padding: '24px' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF', border: '1px solid rgba(39, 60, 44, 0.2)', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><img src={logoImg} alt="Logo Cultural Inglesa de Oxford" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #273C2C' }} /><h1 style={{ fontSize: '1.35rem' }}>Ingresar</h1></div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Correo electrónico</label>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #273C2C', borderRadius: '8px' }} />
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Contraseña</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #273C2C', borderRadius: '8px' }} />
        {error && <p role="alert" style={{ color: '#D32F2F', marginBottom: '16px' }}>{error}</p>}
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', backgroundColor: '#1F3A60', color: '#FFFFFF', padding: '12px', borderRadius: '20px', fontWeight: 700 }}>{isSubmitting ? 'INGRESANDO...' : 'INGRESAR'}</button>
        <button type="button" onClick={onBack} style={{ width: '100%', marginTop: '12px', padding: '10px', color: '#273C2C', fontWeight: 700 }}>VOLVER</button>
      </form>
    </main>
  );
};
