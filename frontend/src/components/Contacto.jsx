import React, { useState } from 'react';
import { Instagram, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { validateNombre, validateEmail, validateTelefono, validateMensaje } from '../utils/validators';
import { alumnoService } from '../services/alumnoService';

export const Contacto = ({ showToast }) => {
  const [formData, setFormData] = useState({
    nombreApellido: '',
    email: '',
    telefono: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    const parts = formData.nombreApellido.trim().split(' ');
    const nombre = parts[0] || '';
    const apellido = parts.slice(1).join(' ') || 'Sin Apellido';

    const nombreErr = validateNombre(nombre);
    const emailErr = validateEmail(formData.email);
    const telefonoErr = validateTelefono(formData.telefono);
    const mensajeErr = validateMensaje(formData.mensaje);

    const newErrors = {};
    if (nombreErr) newErrors.nombreApellido = nombreErr;
    if (emailErr) newErrors.email = emailErr;
    if (telefonoErr) newErrors.telefono = telefonoErr;
    if (mensajeErr) newErrors.mensaje = mensajeErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Por favor, corregí los errores en el formulario.');
      return;
    }

    setIsLoading(true);

    try {
      // Connect to Backend API (Entrega 2 endpoint POST /api/alumnos)
      await alumnoService.create({
        nombre: nombre,
        apellido: apellido,
        email: formData.email,
        telefono: formData.telefono,
        fechaNacimiento: '2000-01-01',
        nivel: 'Consulta / General',
      });

      showToast('success', '¡Gracias por contactarnos! Tu consulta ha sido registrada exitosamente.');
      setFormData({
        nombreApellido: '',
        email: '',
        telefono: '',
        mensaje: '',
      });
      setErrors({});
    } catch (err) {
      console.error(err);
      // Fallback: Even if email already exists or backend API returns conflict, give actionable feedback
      if (err.message.includes('DUPLICATED') || err.message.includes('ya existe')) {
        showToast('error', 'El correo ingresado ya se encuentra registrado en el sistema.');
      } else {
        showToast('error', err.message || 'Ocurrió un error al enviar el formulario.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contacto" aria-labelledby="contacto-title" style={{ padding: '80px 0', backgroundColor: '#FEF7ED' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Left Column - Information & Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2
                id="contacto-title"
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
                CONTACTO
              </h2>
              <p style={{ fontWeight: 700, color: '#273C2C', fontSize: '1rem', marginBottom: '20px' }}>
                Lunes a Jueves de 17 a 20.30hs
              </p>
            </div>

            {/* Social & Direct Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <a
                href="https://instagram.com/laculturalinglesadeoxford"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#273C2C',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <Instagram size={20} style={{ color: '#273C2C' }} />
                <span>@laculturalinglesadeoxford</span>
              </a>

              <a
                href="https://wa.me/5491161802607"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#273C2C',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <Phone size={20} style={{ color: '#273C2C' }} />
                <span>1161802607</span>
              </a>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: '#273C2C',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                <MapPin size={20} style={{ color: '#273C2C', flexShrink: 0, marginTop: '2px' }} />
                <span>Av. Salvador María Del Carril 2568, Villa Pueyrredón</span>
              </div>
            </div>

            {/* Map Frame matching Mockup */}
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1.5px solid #273C2C',
                marginTop: '10px',
                height: '240px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              <iframe
                title="Ubicación Cultural Inglesa de Oxford"
                src="https://maps.google.com/maps?q=Av.+Salvador+Mar%C3%ADa+del+Carril+2568,+Villa+Pueyrred%C3%B3n,+Buenos+Aires&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Right Column - Deep Blue Card Form matching Figma */}
          <div
            style={{
              backgroundColor: '#1F3A60',
              borderRadius: '24px',
              padding: '32px 28px',
              color: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(31, 58, 96, 0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.35rem',
                fontWeight: 700,
                textAlign: 'center',
                color: '#FFFFFF',
                lineHeight: 1.4,
                marginBottom: '28px',
              }}
            >
              Mandanos tu duda y te<br />
              contactaremos lo antes posible!
            </h3>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Field: Nombre y apellido */}
              <div>
                <label
                  htmlFor="nombreApellido"
                  style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}
                >
                  Nombre y apellido
                </label>
                <input
                  id="nombreApellido"
                  name="nombreApellido"
                  type="text"
                  value={formData.nombreApellido}
                  onChange={handleChange}
                  placeholder="Ej. María González"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: errors.nombreApellido ? '2px solid #FF5252' : 'none',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#273C2C',
                  }}
                  aria-invalid={!!errors.nombreApellido}
                  aria-describedby={errors.nombreApellido ? 'err-nombre' : undefined}
                />
                {errors.nombreApellido && (
                  <span id="err-nombre" style={{ color: '#FF8A80', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {errors.nombreApellido}
                  </span>
                )}
              </div>

              {/* Field: Email */}
              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ej. maria@ejemplo.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: errors.email ? '2px solid #FF5252' : 'none',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#273C2C',
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'err-email' : undefined}
                />
                {errors.email && (
                  <span id="err-email" style={{ color: '#FF8A80', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Field: Teléfono */}
              <div>
                <label
                  htmlFor="telefono"
                  style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}
                >
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej. 1198765432"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: errors.telefono ? '2px solid #FF5252' : 'none',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#273C2C',
                  }}
                  aria-invalid={!!errors.telefono}
                  aria-describedby={errors.telefono ? 'err-telefono' : undefined}
                />
                {errors.telefono && (
                  <span id="err-telefono" style={{ color: '#FF8A80', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {errors.telefono}
                  </span>
                )}
              </div>

              {/* Field: Mensaje */}
              <div>
                <label
                  htmlFor="mensaje"
                  style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}
                >
                  Mensaje
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={4}
                  value={formData.mensaje}
                  onChange={handleChange}
                  placeholder="Escribí aquí tu mensaje o consulta..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: errors.mensaje ? '2px solid #FF5252' : 'none',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#273C2C',
                    resize: 'vertical',
                  }}
                  aria-invalid={!!errors.mensaje}
                  aria-describedby={errors.mensaje ? 'err-mensaje' : undefined}
                />
                {errors.mensaje && (
                  <span id="err-mensaje" style={{ color: '#FF8A80', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {errors.mensaje}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1F3A60',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {isLoading ? (
                  <span>Enviando consulta...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar consulta</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
