import React, { useEffect, useMemo, useState } from 'react';
import { 
  Edit2, 
  Plus, 
  User, 
  X, 
  ChevronDown, 
  GraduationCap, 
  Users, 
  Phone, 
  Mail, 
  BookOpen, 
  Sparkles,
  Check
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';
import { calculateAge, getCourseNameByAge } from '../utils/ageCourse';

const emptyForm = { 
  nombre: '', 
  apellido: '', 
  email: '', 
  dni: '', 
  telefono: '', 
  fechaNacimiento: '', 
  cursoId: '', 
  cursoIds: [], 
  rol: 'ALUMNO' 
};

export const AdminPage = ({ showToast, onLogout }) => {
  const [activeTab, setActiveTab] = useState('ALUMNO');
  const [state, setState] = useState({ users: [], cursos: [], inscripciones: [] });
  const [form, setForm] = useState(emptyForm); 
  const [showForm, setShowForm] = useState(false); 
  const [selected, setSelected] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false); 
  const [menuOpen, setMenuOpen] = useState(false);

  const loadState = async () => { 
    setIsLoading(true);
    try { 
      setState(await academyService.getState()); 
    } catch (e) {
      showToast('error', e.message); 
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => { loadState(); }, []);

  const users = useMemo(() => (state.users || []).filter((u) => u.rol === activeTab), [state.users, activeTab]);

  const getCursosForUser = (u) => {
    if (u.rol === 'ALUMNO') {
      const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id);
      const c = (state.cursos || []).find((course) => course.id === enrollment?.cursoId);
      return c ? [c] : [];
    } else {
      return (state.cursos || []).filter((course) => course.teacherId === u.id);
    }
  };

  const openNew = () => { 
    setSelected(null); 
    setForm({ ...emptyForm, rol: activeTab, cursoIds: [] }); 
    setShowForm(true); 
  };

  const openEdit = (u) => { 
    const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id); 
    const profeCursos = (state.cursos || []).filter((c) => c.teacherId === u.id);
    const assignedIds = profeCursos.map((c) => c.id);

    setForm({ 
      ...emptyForm, 
      ...u, 
      cursoId: String(u.rol === 'ALUMNO' ? enrollment?.cursoId || '' : (assignedIds[0] || '')),
      cursoIds: assignedIds
    }); 
    setSelected(null);
    setShowForm(true);
  };

  const update = (e) => {
    const { name, value } = e.target;
    
    // Auto-assignment for ALUMNO based on birth date
    if (name === 'fechaNacimiento' && form.rol === 'ALUMNO' && value) {
      const age = calculateAge(value);
      const suggestedCourseName = getCourseNameByAge(age);
      const matchingCourse = (state.cursos || []).find(
        (c) => c.name.toLowerCase() === (suggestedCourseName || '').toLowerCase()
      );
      
      setForm((prev) => ({
        ...prev,
        [name]: value,
        cursoId: matchingCourse ? String(matchingCourse.id) : prev.cursoId
      }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleCourseForTeacher = (courseId) => {
    setForm((prev) => {
      const current = prev.cursoIds || [];
      const numericId = Number(courseId);
      const exists = current.includes(numericId);
      const updated = exists 
        ? current.filter((id) => id !== numericId)
        : [...current, numericId];
      return {
        ...prev,
        cursoIds: updated,
        cursoId: updated[0] ? String(updated[0]) : ''
      };
    });
  };

  const submit = async (e) => { 
    e.preventDefault(); 
    if (form.rol === 'PROFESOR' && (!form.cursoIds || form.cursoIds.length === 0)) {
      showToast('error', 'Por favor seleccioná al menos 1 curso para el profesor.');
      return;
    }

    setIsSaving(true); 
    try {
      if (form.id) {
        await academyService.updateUser(form.id, form); 
      } else if (form.rol === 'ALUMNO') {
        await academyService.registerStudent(form); 
      } else {
        await academyService.registerTeacher(form); 
      }
      showToast('success', form.id ? 'Datos actualizados correctamente.' : 'Usuario registrado exitosamente.'); 
      setShowForm(false); 
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally { 
      setIsSaving(false); 
    } 
  };

  // Compute calculated course suggestion text when editing an alumno
  const computedStudentCourse = useMemo(() => {
    if (form.rol !== 'ALUMNO' || !form.fechaNacimiento) return null;
    const age = calculateAge(form.fechaNacimiento);
    const courseName = getCourseNameByAge(age);
    const courseObj = (state.cursos || []).find(
      (c) => c.name.toLowerCase() === (courseName || '').toLowerCase()
    );
    return { age, courseName, courseObj };
  }, [form.rol, form.fechaNacimiento, state.cursos]);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(20px, 6vw, 48px)',
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(39,60,44,0.12)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logoImg}
            alt="Logo Cultural Inglesa de Oxford"
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #273C2C' }}
          />
          {/* Institution title hidden in mobile, shown on tablet/desktop */}
          <div className="portal-nav-title" style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontFamily: 'var(--font-serif)', lineHeight: 1.15, fontSize: '0.95rem', color: '#273C2C' }}>
              CULTURAL INGLESA DE OXFORD
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 600, letterSpacing: '0.5px' }}>
              PANEL ADMINISTRATIVO
            </span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 12,
              background: '#FAF3E8',
              border: '1px solid rgba(39,60,44,0.15)',
              color: '#273C2C',
              fontSize: '0.88rem',
            }}
          >
            <User size={18} color="#1F3A60" />
            <span>Administrador</span>
            <ChevronDown size={15} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 48,
                zIndex: 50,
                background: '#FFFFFF',
                border: '1px solid rgba(39,60,44,0.18)',
                borderRadius: 12,
                padding: 6,
                minWidth: 170,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#D32F2F',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  borderRadius: 8,
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container with generous side margins */}
      <section className="page-content-wrapper" style={{ flex: 1 }}>
        {/* Top Controls: Segmented Tabs & Action Button */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Segmented Control */}
          <div
            className="tabs-mobile-stretch"
            style={{
              display: 'inline-flex',
              background: '#EAE1D3',
              padding: 4,
              borderRadius: 14,
              border: '1px solid rgba(39,60,44,0.15)',
            }}
          >
            <button
              onClick={() => setActiveTab('ALUMNO')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                background: activeTab === 'ALUMNO' ? '#273C2C' : 'transparent',
                color: activeTab === 'ALUMNO' ? '#FFFFFF' : '#4A554A',
                boxShadow: activeTab === 'ALUMNO' ? '0 2px 6px rgba(39,60,44,0.2)' : 'none',
              }}
            >
              <GraduationCap size={18} />
              Alumnos ({state.users.filter((u) => u.rol === 'ALUMNO').length})
            </button>

            <button
              onClick={() => setActiveTab('PROFESOR')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                background: activeTab === 'PROFESOR' ? '#273C2C' : 'transparent',
                color: activeTab === 'PROFESOR' ? '#FFFFFF' : '#4A554A',
                boxShadow: activeTab === 'PROFESOR' ? '0 2px 6px rgba(39,60,44,0.2)' : 'none',
              }}
            >
              <Users size={18} />
              Profesores ({state.users.filter((u) => u.rol === 'PROFESOR').length})
            </button>
          </div>

          {/* New Register Button - Stretches full width on mobile via CSS class */}
          <button
            onClick={openNew}
            className="btn-mobile-stretch"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#1F3A60',
              color: '#FFFFFF',
              padding: '12px 22px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.92rem',
              boxShadow: '0 4px 14px rgba(31,58,96,0.25)',
            }}
          >
            <Plus size={18} />
            Registrar {activeTab === 'ALUMNO' ? 'alumno' : 'profesor'}
          </button>
        </div>

        {/* Content: Responsive Table / Mobile Cards */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4A554A' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Cargando registros...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={emptyCardStyle}>
            {activeTab === 'ALUMNO' ? <GraduationCap size={40} color="#687768" /> : <Users size={40} color="#687768" />}
            <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', marginTop: 12 }}>
              No hay {activeTab === 'ALUMNO' ? 'alumnos' : 'profesores'} registrados
            </h3>
            <p style={{ color: '#687768', fontSize: '0.9rem', marginTop: 4 }}>
              Hacé clic en el botón superior para agregar el primer registro.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="desktop-table-view" style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
                    <th style={thStyle}>DNI</th>
                    <th style={thStyle}>Nombre completo</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Teléfono</th>
                    <th style={thStyle}>{activeTab === 'ALUMNO' ? 'Curso' : 'Cursos asignados'}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const assignedCursos = getCursosForUser(u);
                    return (
                      <tr
                        key={u.id}
                        style={{ ...trHoverStyle, cursor: 'pointer' }}
                        onClick={() => setSelected(u)}
                      >
                        <td style={tdStyle}>{u.dni || '-'}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1F2820' }}>
                          {u.nombre} {u.apellido}
                        </td>
                        <td style={tdStyle}>{u.email}</td>
                        <td style={tdStyle}>{u.telefono || '-'}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {assignedCursos.length > 0 ? (
                              assignedCursos.map((c) => (
                                <span key={c.id} style={courseBadgeStyle(c)}>
                                  {c.name}
                                </span>
                              ))
                            ) : (
                              <span style={courseBadgeStyle(null)}>Sin cursos</span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(u);
                            }}
                            aria-label="Editar usuario"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: 'rgba(39,60,44,0.08)',
                              color: '#273C2C',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.82rem',
                              fontWeight: 600,
                            }}
                          >
                            <Edit2 size={15} /> Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Mobile-First) */}
            <div className="mobile-cards-view">
              {users.map((u) => {
                const assignedCursos = getCursosForUser(u);
                return (
                  <div
                    key={u.id}
                    style={cardMobileStyle}
                    onClick={() => setSelected(u)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(39,60,44,0.1)', paddingBottom: 10 }}>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#273C2C' }}>
                          {u.nombre} {u.apellido}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#687768' }}>
                          DNI: {u.dni || 'Sin registrar'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(u);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(31,58,96,0.1)',
                          color: '#1F3A60',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, fontSize: '0.86rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4A554A' }}>
                        <Mail size={15} color="#1F3A60" />
                        <span>{u.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4A554A' }}>
                        <Phone size={15} color="#1F3A60" />
                        <span>{u.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                        <BookOpen size={15} color="#273C2C" style={{ marginTop: 2 }} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {assignedCursos.length > 0 ? (
                            assignedCursos.map((c) => (
                              <span key={c.id} style={courseBadgeStyle(c)}>
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span style={courseBadgeStyle(null)}>Sin cursos asignados</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Modern Vertical Form Modal */}
      {showForm && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={submit} className="custom-scrollbar" style={verticalModalContainer}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#273C2C' }}>
                  {form.id ? 'Editar usuario' : `Registrar ${form.rol === 'ALUMNO' ? 'alumno' : 'profesor'}`}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#687768', marginTop: 2 }}>
                  Completá los datos solicitados a continuación
                </p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} style={{ color: '#4A554A' }}>
                <X size={20} />
              </button>
            </div>

            {/* Vertical Stack Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!form.id && (
                <label style={fieldLabelStyle}>
                  Tipo de usuario *
                  <select
                    name="rol"
                    value={form.rol}
                    onChange={(e) => {
                      update(e);
                    }}
                    className="custom-select"
                  >
                    <option value="ALUMNO">Alumno</option>
                    <option value="PROFESOR">Profesor</option>
                  </select>
                </label>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <label style={fieldLabelStyle}>
                  Nombre *
                  <input
                    name="nombre"
                    type="text"
                    required
                    value={form.nombre || ''}
                    onChange={update}
                    placeholder="Ej. Martín"
                    className="custom-text-input"
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Apellido *
                  <input
                    name="apellido"
                    type="text"
                    required
                    value={form.apellido || ''}
                    onChange={update}
                    placeholder="Ej. Rossi"
                    className="custom-text-input"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <label style={fieldLabelStyle}>
                  DNI *
                  <input
                    name="dni"
                    type="text"
                    required
                    value={form.dni || ''}
                    onChange={update}
                    placeholder="Ej. 42123456"
                    className="custom-text-input"
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Teléfono (opcional)
                  <input
                    name="telefono"
                    type="tel"
                    value={form.telefono || ''}
                    onChange={update}
                    placeholder="Ej. 1161234567"
                    className="custom-text-input"
                  />
                </label>
              </div>

              <label style={fieldLabelStyle}>
                Correo electrónico *
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email || ''}
                  onChange={update}
                  placeholder="ejemplo@correo.com"
                  className="custom-text-input"
                />
              </label>

              {/* Date of Birth field with auto-course assignment for Alumnos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={fieldLabelStyle}>
                  Fecha de nacimiento {form.rol === 'ALUMNO' ? '*' : '(opcional)'}
                  <input
                    name="fechaNacimiento"
                    type="date"
                    required={form.rol === 'ALUMNO'}
                    value={form.fechaNacimiento || ''}
                    onChange={update}
                    className="custom-date-input"
                  />
                </label>

                {form.rol === 'ALUMNO' && computedStudentCourse && (
                  <div
                    style={{
                      background: 'rgba(31,58,96,0.08)',
                      border: '1px solid rgba(31,58,96,0.2)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: '0.84rem',
                      color: '#1F3A60',
                    }}
                  >
                    <Sparkles size={18} color="#1F3A60" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Curso asignado automáticamente ({computedStudentCourse.age} años): </strong>
                      <span>{computedStudentCourse.courseName || 'Determinado según rango'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Assignment:
                  - For Alumno: single course dropdown (auto-selected by date of birth)
                  - For Professor: MULTIPLE COURSES SELECTION (1 or more courses)
              */}
              {form.rol === 'ALUMNO' ? (
                <label style={fieldLabelStyle}>
                  Curso del alumno *
                  <select
                    name="cursoId"
                    value={form.cursoId}
                    onChange={update}
                    required
                    className="custom-select"
                  >
                    <option value="">-- Seleccionar curso --</option>
                    {(state.cursos || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.schedule || c.level})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#687768', fontSize: '0.78rem', marginTop: 2 }}>
                    Se asigna automáticamente al ingresar la fecha de nacimiento.
                  </small>
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabelStyle}>
                    Cursos asignados al profesor (seleccioná 1 o más) *
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
                    {(state.cursos || []).map((c) => {
                      const isChecked = (form.cursoIds || []).includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`course-checkbox-card ${isChecked ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourseForTeacher(c.id)}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.88rem', color: '#273C2C' }}>{c.name}</strong>
                            <span style={{ fontSize: '0.74rem', color: '#687768' }}>{c.schedule || c.level}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <small style={{ color: '#687768', fontSize: '0.78rem' }}>
                    Marcá las casillas de los cursos que tendrá a cargo este docente.
                  </small>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(39,60,44,0.1)' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={btnPrimary}
              >
                {isSaving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected User Detail Drawer */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSelected(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              marginLeft: 'auto',
              width: 'min(440px, 92vw)',
              height: '100%',
              background: '#FEF7ED',
              borderLeft: '2px solid #273C2C',
              padding: '28px 24px',
              boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              animation: 'slideInRight 0.25s ease-out',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>
                  Ficha del usuario
                </h2>
                <button onClick={() => setSelected(null)} style={{ color: '#4A554A' }}><X size={20} /></button>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 18, border: '1px solid rgba(39,60,44,0.15)' }}>
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(39,60,44,0.08)' }}>
                  <span style={detailKeyStyle}>Nombre completo</span>
                  <div style={detailValueStyle}>{selected.nombre} {selected.apellido}</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(39,60,44,0.08)' }}>
                  <span style={detailKeyStyle}>Rol</span>
                  <div style={detailValueStyle}>{selected.rol}</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(39,60,44,0.08)' }}>
                  <span style={detailKeyStyle}>DNI</span>
                  <div style={detailValueStyle}>{selected.dni || 'Sin registrar'}</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(39,60,44,0.08)' }}>
                  <span style={detailKeyStyle}>Email</span>
                  <div style={detailValueStyle}>{selected.email}</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(39,60,44,0.08)' }}>
                  <span style={detailKeyStyle}>Teléfono</span>
                  <div style={detailValueStyle}>{selected.telefono || 'Sin registrar'}</div>
                </div>
                {selected.fechaNacimiento && (
                  <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(39,60,44,0.08)' }}>
                    <span style={detailKeyStyle}>Fecha de nacimiento</span>
                    <div style={detailValueStyle}>{selected.fechaNacimiento}</div>
                  </div>
                )}
                <div style={{ padding: '8px 0' }}>
                  <span style={detailKeyStyle}>
                    {selected.rol === 'ALUMNO' ? 'Curso actual' : 'Cursos asignados'}
                  </span>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {getCursosForUser(selected).length > 0 ? (
                      getCursosForUser(selected).map((c) => (
                        <span key={c.id} style={courseBadgeStyle(c)}>
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.88rem', color: '#817D78' }}>Sin cursos asignados</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => openEdit(selected)}
              style={{ ...btnPrimary, width: '100%', marginTop: 24, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Edit2 size={16} /> Editar datos
            </button>
          </aside>
        </div>
      )}
    </main>
  );
};

/* =========================================================================
   STYLE HELPERS
   ========================================================================= */
const tableContainerStyle = {
  background: '#FFFFFF',
  borderRadius: 18,
  border: '1.5px solid rgba(39,60,44,0.18)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-sm)',
};

const thStyle = {
  padding: '16px 20px',
  textAlign: 'left',
  fontSize: '0.84rem',
  fontWeight: 700,
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '14px 20px',
  borderBottom: '1px solid rgba(39,60,44,0.08)',
  fontSize: '0.88rem',
  color: '#1F2820',
};

const trHoverStyle = {
  transition: 'background-color 0.15s ease',
};

const cardMobileStyle = {
  background: '#FFFFFF',
  border: '1.5px solid rgba(39,60,44,0.14)',
  borderRadius: 16,
  padding: '18px 16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const emptyCardStyle = {
  background: '#FFFFFF',
  border: '1.5px dashed rgba(39,60,44,0.25)',
  borderRadius: 20,
  padding: '48px 24px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const courseBadgeStyle = (curso) => ({
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 8,
  fontSize: '0.82rem',
  fontWeight: 700,
  background: curso ? 'rgba(31,58,96,0.1)' : 'rgba(129,125,120,0.12)',
  color: curso ? '#1F3A60' : '#817D78',
});

const fieldLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontWeight: 600,
  fontSize: '0.88rem',
  color: '#273C2C',
};

const detailKeyStyle = {
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: '#687768',
  letterSpacing: '0.5px',
  display: 'block',
};

const detailValueStyle = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: '#273C2C',
  marginTop: 2,
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const verticalModalContainer = {
  width: 'min(580px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#FEF7ED',
  border: '2px solid #273C2C',
  borderRadius: 20,
  padding: '24px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
};

const btnPrimary = {
  background: '#1F3A60',
  color: '#FFFFFF',
  padding: '10px 22px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: '0.92rem',
  boxShadow: '0 4px 12px rgba(31,58,96,0.25)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};
