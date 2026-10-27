import React, { useState, useMemo } from 'react';
import logoImg from '../assets/logo.jpg';
import { authService } from '../services/authService';
import { calculateAge, getCourseMetaByAge } from '../utils/ageCourse';
import { CheckCircle2, AlertCircle, BookOpen, ArrowLeft } from 'lucide-react';

export const LoginPage = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regData, setRegData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    fechaNacimiento: '',
    password: '',
    rol: 'ALUMNO',
  });

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

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegData((prev) => ({
      ...prev,
      [name]: name === 'dni' ? value.replace(/\D/g, '') : value,
    }));
  };

  const computedAge = useMemo(() => {
    if (regData.fechaNacimiento) {
      return calculateAge(regData.fechaNacimiento);
    }
    return null;
  }, [regData.fechaNacimiento]);

  const assignedMeta = useMemo(() => {
    if (computedAge !== null && computedAge >= 4) {
      return getCourseMetaByAge(computedAge);
    }
    return null;
  }, [computedAge]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (!regData.fechaNacimiento) {
        throw new Error('La fecha de nacimiento es obligatoria.');
      }
      if (computedAge !== null && computedAge < 4) {
        throw new Error('El alumno debe tener al menos 4 años de edad.');
      }
      const result = await authService.register(regData);
      sessionStorage.setItem('authToken', result.token);
      sessionStorage.setItem('authUser', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Error al completar el registro.');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
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
              {mode === 'login' ? 'Acceso al Portal' : 'Inscripción de Alumno'}
            </span>
          </div>
        </div>

        {/* Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F0EBE0',
            padding: 4,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.9rem',
              background: mode === 'login' ? '#FFFFFF' : 'transparent',
              color: mode === 'login' ? '#1F3A60' : '#687768',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.9rem',
              background: mode === 'register' ? '#FFFFFF' : 'transparent',
              color: mode === 'register' ? '#1F3A60' : '#687768',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Registrarme
          </button>
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

        {mode === 'login' ? (
          /* Login Form (Vertical & clean) */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.84rem', color: '#273C2C' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="alumno@ejemplo.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(39,60,44,0.22)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.84rem', color: '#273C2C' }}>
                Contraseña
              </label>
              <input
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
              }}
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          /* Register Form (Streamlined Vertical Flow) */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={regData.nombre}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Ej. Lucas"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={regData.apellido}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Ej. Gómez"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                  DNI (Solo números) *
                </label>
                <input
                  type="text"
                  name="dni"
                  value={regData.dni}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Ej. 43123456"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={regData.telefono}
                  onChange={handleRegisterChange}
                  placeholder="Ej. 11 98765432"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={regData.email}
                onChange={handleRegisterChange}
                required
                placeholder="alumno@ejemplo.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                name="fechaNacimiento"
                value={regData.fechaNacimiento}
                onChange={handleRegisterChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
              />
            </div>

            {/* Pre-selected Course Preview Card (Clean, automated, no confirmation popup) */}
            {regData.fechaNacimiento && (
              <div
                style={{
                  background: computedAge !== null && computedAge >= 4 ? '#F4F9F4' : '#FFF5F5',
                  border: `1.5px solid ${computedAge !== null && computedAge >= 4 ? '#A7D7A9' : '#FFCDD2'}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: computedAge !== null && computedAge >= 4 ? '#2E7D32' : '#D32F2F',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {computedAge !== null && computedAge >= 4 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                </div>

                <div style={{ flexGrow: 1 }}>
                  {computedAge !== null && computedAge >= 4 ? (
                    <>
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7D32', fontWeight: 800 }}>
                        CURSO ASIGNADO ({computedAge} AÑOS)
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#273C2C', marginTop: 2 }}>
                        {assignedMeta?.name} ({assignedMeta?.bracket})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#4A554A', marginTop: 2 }}>
                        Horario: {assignedMeta?.schedule}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#D32F2F', fontSize: '0.84rem', fontWeight: 600 }}>
                      El alumno debe tener al menos 4 años de edad para inscribirse.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 700, fontSize: '0.82rem', color: '#273C2C' }}>
                Crear Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={regData.password}
                onChange={handleRegisterChange}
                required
                minLength={4}
                placeholder="Mínimo 4 caracteres"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
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
              }}
            >
              {isSubmitting ? 'Registrando...' : 'Completar Registro'}
            </button>
          </form>
        )}

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
          }}
        >
          <ArrowLeft size={16} /> Volver a la página principal
        </button>
      </div>
    </main>
  );
};
