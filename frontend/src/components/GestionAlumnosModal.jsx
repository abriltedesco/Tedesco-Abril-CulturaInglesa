import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { alumnoService } from '../services/alumnoService';
import { academyService } from '../services/academyService';
import { LoadingSpinner } from './LoadingSpinner';
import { ConfirmModal } from './ConfirmModal';
import { validateNombre, validateApellido, validateEmail, validateTelefono } from '../utils/validators';

export const GestionAlumnosModal = ({ isOpen, onClose, showToast }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState('ALUMNO');

  // Form state for creating/editing
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    fechaNacimiento: '2005-01-01',
    nivel: 'Niños',
  });
  const [errors, setErrors] = useState({});

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch list of students from Backend API
  const fetchAlumnos = async () => {
    setIsLoading(true);
    try {
      const data = await alumnoService.getAll();
      setAlumnos(data || []);
    } catch (err) {
      console.error('Error al cargar alumnos:', err);
      showToast('error', err.message || 'Error al conectar con la API del backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlumnos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setUserType('ALUMNO');
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      dni: '',
      telefono: '',
      fechaNacimiento: '2005-01-01',
      nivel: 'Niños',
    });
    setErrors({});
  };

  const handleStartEdit = (alumno) => {
    setEditingId(alumno.id);
    setUserType('ALUMNO');
    setFormData({
      nombre: alumno.nombre || '',
      apellido: alumno.apellido || '',
      email: alumno.email || '',
      dni: alumno.dni || '',
      telefono: alumno.telefono || '',
      fechaNacimiento: alumno.fechaNacimiento ? alumno.fechaNacimiento.split('T')[0] : '2005-01-01',
      nivel: alumno.nivel || 'Niños',
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreErr = validateNombre(formData.nombre);
    const apellidoErr = validateApellido(formData.apellido);
    const emailErr = validateEmail(formData.email);
    const telefonoErr = validateTelefono(formData.telefono);

    const newErrors = {};
    if (nombreErr) newErrors.nombre = nombreErr;
    if (apellidoErr) newErrors.apellido = apellidoErr;
    if (emailErr) newErrors.email = emailErr;
    if (!formData.dni || !/^\d+$/.test(formData.dni)) newErrors.dni = 'El DNI debe contener únicamente números.';
    if (telefonoErr) newErrors.telefono = telefonoErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Por favor, completá adecuadamente los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        // PUT update
        await alumnoService.update(editingId, formData);
        showToast('success', 'Alumno actualizado correctamente.');
      } else {
        const register = userType === 'PROFESOR' ? academyService.registerTeacher : academyService.registerStudent;
        await register(formData);
        if (userType === 'ALUMNO') await alumnoService.create(formData);
        showToast('success', `${userType === 'PROFESOR' ? 'Profesor' : 'Alumno'} registrado. Su contraseña inicial es su email.`);
      }
      handleResetForm();
      fetchAlumnos();
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Error al guardar el alumno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await alumnoService.remove(deleteTarget.id);
      showToast('success', `El alumno ${deleteTarget.nombre} ${deleteTarget.apellido} ha sido eliminado.`);
      setDeleteTarget(null);
      fetchAlumnos();
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'No se pudo eliminar el registro.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gestion-modal-title"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        <div
          style={{
            backgroundColor: '#FEF7ED',
            borderRadius: '20px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
            border: '2px solid #273C2C',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#1F3A60',
              color: '#FFFFFF',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserCheck size={26} />
              <h2 id="gestion-modal-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFFFFF' }}>
                Gestión de Alumnos & Inscripciones (API Backend)
              </h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar ventana de gestión"
              style={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Form Section: Add or Edit Student */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #273C2C',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#273C2C', marginBottom: '16px' }}>
                {editingId ? 'Editar Alumno Existente' : 'Registrar Nuevo Alumno'}
              </h3>

              <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {!editingId && (
                  <div>
                    <label htmlFor="userType" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>Tipo de usuario *</label>
                    <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #273C2C', fontSize: '0.9rem', backgroundColor: '#FFFFFF' }}>
                      <option value="ALUMNO">Alumno</option>
                      <option value="PROFESOR">Profesor</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="nombre" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>
                    Nombre *
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.nombre ? '2px solid #D32F2F' : '1px solid #273C2C',
                      fontSize: '0.9rem',
                    }}
                  />
                  {errors.nombre && <span style={{ color: '#D32F2F', fontSize: '0.78rem' }}>{errors.nombre}</span>}
                </div>

                <div>
                  <label htmlFor="apellido" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>
                    Apellido *
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.apellido ? '2px solid #D32F2F' : '1px solid #273C2C',
                      fontSize: '0.9rem',
                    }}
                  />
                  {errors.apellido && <span style={{ color: '#D32F2F', fontSize: '0.78rem' }}>{errors.apellido}</span>}
                </div>

                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.email ? '2px solid #D32F2F' : '1px solid #273C2C',
                      fontSize: '0.9rem',
                    }}
                  />
                  {errors.email && <span style={{ color: '#D32F2F', fontSize: '0.78rem' }}>{errors.email}</span>}
                </div>

                <div>
                  <label htmlFor="dni" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>DNI *</label>
                  <input id="dni" name="dni" type="text" inputMode="numeric" value={formData.dni} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: errors.dni ? '2px solid #D32F2F' : '1px solid #273C2C', fontSize: '0.9rem' }} />
                  {errors.dni && <span style={{ color: '#D32F2F', fontSize: '0.78rem' }}>{errors.dni}</span>}
                </div>

                {userType === 'ALUMNO' && (
                  <>
                    <div>
                      <label htmlFor="fechaNacimiento" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>Fecha de nacimiento *</label>
                      <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #273C2C', fontSize: '0.9rem' }} />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="telefono" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>
                    Teléfono *
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: errors.telefono ? '2px solid #D32F2F' : '1px solid #273C2C',
                      fontSize: '0.9rem',
                    }}
                  />
                  {errors.telefono && <span style={{ color: '#D32F2F', fontSize: '0.78rem' }}>{errors.telefono}</span>}
                </div>

                <div>
                  <label htmlFor="nivel" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#273C2C', marginBottom: '4px' }}>
                    Nivel / Curso
                  </label>
                  <select
                    id="nivel"
                    name="nivel"
                    value={formData.nivel}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #273C2C',
                      fontSize: '0.9rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <option value="Niños">Niños (4-11 años)</option>
                    <option value="Adolescentes">Adolescentes (12-18 años)</option>
                    <option value="Adultos">Adultos</option>
                    <option value="First Certificate (FCE)">First Certificate (FCE)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: '1px solid #273C2C',
                        backgroundColor: '#FFFFFF',
                        color: '#273C2C',
                        fontWeight: 600,
                      }}
                    >
                      Cancelar Edición
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      backgroundColor: '#1F3A60',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isSubmitting ? (
                      'Guardando...'
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>{editingId ? 'Guardar Cambios' : `Registrar ${userType === 'PROFESOR' ? 'Profesor' : 'Alumno'}`}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List Table Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#273C2C' }}>
                  Alumnos Registrados ({alumnos.length})
                </h3>
                <button
                  onClick={fetchAlumnos}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#1F3A60',
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={16} />
                  Actualizar Lista
                </button>
              </div>

              {isLoading ? (
                <LoadingSpinner label="Cargando alumnos desde la API backend..." />
              ) : alumnos.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px dashed #273C2C',
                    borderRadius: '12px',
                    padding: '36px',
                    textAlign: 'center',
                    color: '#4A554A',
                  }}
                >
                  <AlertCircle size={36} style={{ marginBottom: '12px', color: '#1F3A60' }} />
                  <p style={{ fontWeight: 600, fontSize: '1rem' }}>No hay alumnos registrados actualmente.</p>
                  <p style={{ fontSize: '0.88rem', marginTop: '4px' }}>
                    Completá el formulario superior para registrar el primer alumno en el backend.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1.5px solid #273C2C', borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#273C2C', color: '#FFFFFF' }}>
                        <th style={{ padding: '12px 16px' }}>ID</th>
                        <th style={{ padding: '12px 16px' }}>Nombre completo</th>
                        <th style={{ padding: '12px 16px' }}>Email</th>
                        <th style={{ padding: '12px 16px' }}>Teléfono</th>
                        <th style={{ padding: '12px 16px' }}>Nivel</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map((alumno, idx) => (
                        <tr
                          key={alumno.id || idx}
                          style={{
                            borderBottom: '1px solid rgba(39, 60, 44, 0.1)',
                            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAF6EE',
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1F3A60' }}>#{alumno.id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#273C2C' }}>
                            {alumno.nombre} {alumno.apellido}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#4A554A' }}>{alumno.email}</td>
                          <td style={{ padding: '12px 16px', color: '#4A554A' }}>{alumno.telefono || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                backgroundColor: '#E1F5FE',
                                color: '#01579B',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {alumno.nivel || 'General'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleStartEdit(alumno)}
                                aria-label={`Editar alumno ${alumno.nombre}`}
                                title="Editar"
                                style={{
                                  padding: '6px',
                                  borderRadius: '6px',
                                  border: '1px solid #1F3A60',
                                  color: '#1F3A60',
                                }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(alumno)}
                                aria-label={`Eliminar alumno ${alumno.nombre}`}
                                title="Eliminar"
                                style={{
                                  padding: '6px',
                                  borderRadius: '6px',
                                  border: '1px solid #D32F2F',
                                  color: '#D32F2F',
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="¿Eliminar registro de alumno?"
        message={`¿Estás seguro de que deseas eliminar permanentemente a ${deleteTarget?.nombre} ${deleteTarget?.apellido}? Esta acción modificará el estado en el backend.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </>
  );
};
