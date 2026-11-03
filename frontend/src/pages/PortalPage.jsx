import React, { useEffect, useMemo, useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp,
  Plus, 
  User, 
  X, 
  BookOpen, 
  GraduationCap,
  Users,
  Award
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';

export const PortalPage = ({ user, onLogout }) => {
  const [state, setState] = useState(null); 
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); 
  const [contraseniaOpen, setContraseniaOpen] = useState(false);
  const [contraseniaForm, setContraseniaForm] = useState({ currentPassword: '', newPassword: '' }); 
  const [calificacionFor, setCalificacionFor] = useState(null); 
  const [calificacion, setCalificacion] = useState({ 
    name: 'Evaluación 1', 
    description: '', 
    date: new Date().toISOString().slice(0, 10), 
    value: '' 
  });
 
  const load = () => academyService.getState().then(setState).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const courses = state?.cursos || []; 
  const enrollments = state?.inscripciones || [];
  const course = (id) => courses.find((c) => c.id === id); 
  const calificacionesFor = (id) => (state?.calificaciones || []).filter((g) => g.inscripcionId === id);

  const students = useMemo(() => {
    return enrollments.map((enrollment) => ({ 
      enrollment, 
      student: state?.users?.find((u) => u.id === enrollment.alumnoId), 
      calificaciones: calificacionesFor(enrollment.id) 
    }));
  }, [state]);

  const saveContrasenia = async (e) => { 
    e.preventDefault(); 
    try { 
      await academyService.changePassword(contraseniaForm); 
      setContraseniaOpen(false); 
      setContraseniaForm({ currentPassword: '', newPassword: '' }); 
      setError(''); 
      alert('¡Contraseña actualizada con éxito!');
    } catch (e2) { 
      setError(e2.message); 
    }
  };

  const saveCalificacion = async (e) => { 
    e.preventDefault(); 
    try { 
      await academyService.grade({ 
        enrollmentId: calificacionFor.enrollment.id, 
        ...calificacion, 
        value: Number(calificacion.value), 
        period: calificacion.name 
      }); 
      setCalificacionFor(null); 
      setCalificacion({ name: 'Evaluación 1', description: '', date: new Date().toISOString().slice(0, 10), value: '' });
      await load(); 
    } catch (e2) { 
      setError(e2.message); 
    } 
  };
  
  const isStudent = user.rol === 'ALUMNO';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
          {/* Hide brand text on mobile, keep logo */}
          <div className="portal-nav-title" style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontFamily: 'var(--font-serif)', lineHeight: 1.15, fontSize: '0.95rem', color: '#273C2C' }}>
              CULTURAL INGLESA DE OXFORD
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 600, letterSpacing: '0.5px' }}>
              PORTAL {isStudent ? 'DEL ESTUDIANTE' : 'DOCENTE'}
            </span>
          </div>
        </div>

        {/* Right side user dropdown */}
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
              fontSize: '0.88rem'
            }}
          >
            <User size={18} color="#1F3A60" />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nombre ? `${user.nombre} ${user.apellido || ''}` : user.email}
            </span>
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
                minWidth: 190,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <button
                onClick={() => { setContraseniaOpen(true); setMenuOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#1F3A60',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  borderRadius: 8,
                }}
              >
                Editar contraseña
              </button>
              <button
                onClick={onLogout}
                style={{
                  display: 'block',
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

      {/* Main Content Area */}
      <section className="page-content-wrapper" style={{ flex: 1 }}>
        {/* Portal Hero / Welcome Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1F3A60 0%, #273C2C 100%)',
            borderRadius: 20,
            padding: '24px 28px',
            color: '#FFFFFF',
            marginBottom: 32,
            boxShadow: '0 8px 24px rgba(31,58,96,0.18)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>
              {isStudent ? <GraduationCap size={14} /> : <Users size={14} />}
              {isStudent ? 'Espacio Académico Personal' : 'Gestión y Calificaciones'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: '#FFFFFF', fontSize: 'clamp(1.4rem, 3vw, 2.1rem)', margin: 0 }}>
              {isStudent ? `¡Hola, ${user.nombre || 'Estudiante'}!` : `Panel de Docente: ${user.nombre || ''}`}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: 6 }}>
              {isStudent 
                ? 'Consultá tus cursos matriculados y tocá cada curso para desplegar tu listado de notas.' 
                : 'Tocá sobre un alumno para desplegar o contraer su historial de notas (1 fila por alumno).'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', color: '#D32F2F', padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {!state ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4A554A' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>Cargando información del portal...</p>
          </div>
        ) : isStudent ? (
          <StudentPortalView enrollments={enrollments} course={course} calificacionesFor={calificacionesFor} />
        ) : (
          <TeacherPortalView students={students} course={course} setCalificacionFor={setCalificacionFor} />
        )}
      </section>

      {/* Change Password Modal */}
      {contraseniaOpen && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={saveContrasenia} className="custom-scrollbar" style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>Editar contraseña</h2>
              <button type="button" onClick={() => setContraseniaOpen(false)} style={{ color: '#4A554A' }}><X size={20} /></button>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: '#273C2C' }}>
              Contraseña actual
              <input
                type="password"
                required
                value={contraseniaForm.currentPassword}
                onChange={(e) => setContraseniaForm({ ...contraseniaForm, currentPassword: e.target.value })}
                className="custom-text-input"
                placeholder="Tu contraseña actual"
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: '#273C2C' }}>
              Nueva contraseña
              <input
                type="password"
                required
                minLength={6}
                value={contraseniaForm.newPassword}
                onChange={(e) => setContraseniaForm({ ...contraseniaForm, newPassword: e.target.value })}
                className="custom-text-input"
                placeholder="Mínimo 6 caracteres"
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setContraseniaOpen(false)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A' }}
              >
                Cancelar
              </button>
              <button type="submit" style={btnPrimary}>
                Guardar contraseña
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grade Submission Modal */}
      {calificacionFor && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={saveCalificacion} className="custom-scrollbar" style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>Cargar calificación</h2>
                <p style={{ fontSize: '0.86rem', color: '#1F3A60', fontWeight: 600, marginTop: 4 }}>
                  Alumno: {calificacionFor.student?.nombre} {calificacionFor.student?.apellido}
                </p>
              </div>
              <button type="button" onClick={() => setCalificacionFor(null)} style={{ color: '#4A554A' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: '#273C2C' }}>
                Nombre de evaluación *
                <input
                  type="text"
                  required
                  value={calificacion.name}
                  onChange={(e) => setCalificacion({ ...calificacion, name: e.target.value })}
                  className="custom-text-input"
                  placeholder="Ej: Evaluación Unidad 1"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: '#273C2C' }}>
                Descripción o contenido evaluado
                <input
                  type="text"
                  value={calificacion.description}
                  onChange={(e) => setCalificacion({ ...calificacion, description: e.target.value })}
                  className="custom-text-input"
                  placeholder="Ej: Gramática y vocabulario"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: '#273C2C' }}>
                  Fecha *
                  <input
                    type="date"
                    required
                    value={calificacion.date}
                    onChange={(e) => setCalificacion({ ...calificacion, date: e.target.value })}
                    className="custom-date-input"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.88rem', color: '#273C2C' }}>
                  Nota / Calificación (0 - 10) *
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={calificacion.value}
                    onChange={(e) => setCalificacion({ ...calificacion, value: e.target.value })}
                    className="custom-text-input"
                    placeholder="10"
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setCalificacionFor(null)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A' }}
              >
                Cancelar
              </button>
              <button type="submit" style={btnPrimary}>
                Guardar calificación
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

/* =========================================================================
   STUDENT PORTAL VIEW: Accordion Grouping
   ========================================================================= */
const StudentPortalView = ({ enrollments, course, calificacionesFor }) => {
  const [expandedId, setExpandedId] = useState(enrollments[0]?.id || null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!enrollments.length) {
    return (
      <div style={emptyCardStyle}>
        <BookOpen size={36} color="#687768" style={{ marginBottom: 12 }} />
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C' }}>Aún no tenés cursos asignados</h3>
        <p style={{ color: '#687768', fontSize: '0.9rem', marginTop: 6 }}>
          Comunicate con administración para formalizar tu inscripción a los cursos disponibles.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {enrollments.map((e) => {
        const cursoObj = course(e.cursoId);
        const list = calificacionesFor(e.id);
        const isExpanded = expandedId === e.id;

        return (
          <div
            key={e.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1.5px solid rgba(39,60,44,0.18)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Header row: Click to expand / collapse */}
            <div
              onClick={() => toggleExpand(e.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                cursor: 'pointer',
                background: isExpanded ? '#FAF3E8' : '#FFFFFF',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1F3A60', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#273C2C', margin: 0 }}>
                    {cursoObj?.name || 'Curso Matriculado'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#687768' }}>
                    {cursoObj?.schedule || cursoObj?.level || 'Horario regular'} · {list.length} {list.length === 1 ? 'evaluación' : 'evaluaciones'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1F3A60' }}>
                  {isExpanded ? 'Ocultar notas' : 'Ver notas'}
                </span>
                {isExpanded ? <ChevronUp size={20} color="#273C2C" /> : <ChevronDown size={20} color="#273C2C" />}
              </div>
            </div>

            {/* Collapsible Grade List */}
            {isExpanded && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(39,60,44,0.1)', background: '#FEF7ED' }}>
                {list.length === 0 ? (
                  <p style={{ fontSize: '0.88rem', color: '#817D78', fontStyle: 'italic', margin: 0 }}>
                    Aún no tenés calificaciones registradas en este curso.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {list.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 12,
                          padding: '12px 18px',
                          border: '1px solid rgba(39,60,44,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: '#273C2C' }}>{g.name}</strong>
                          {g.description && (
                            <span style={{ fontSize: '0.82rem', color: '#687768', display: 'block' }}>
                              {g.description}
                            </span>
                          )}
                          <span style={{ fontSize: '0.76rem', color: '#817D78' }}>Fecha: {g.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4A554A' }}>Nota:</span>
                          <span style={badgeGradeStyle(g.value)}>{g.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================
   TEACHER PORTAL VIEW: 1 Single Row per Student + Collapsible Notes List
   ========================================================================= */
const TeacherPortalView = ({ students, course, setCalificacionFor }) => {
  // Store expanded student enrollment IDs
  const [expandedStudents, setExpandedStudents] = useState({});

  const toggleStudent = (enrollmentId) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [enrollmentId]: !prev[enrollmentId],
    }));
  };

  if (!students.length) {
    return (
      <div style={emptyCardStyle}>
        <Users size={36} color="#687768" style={{ marginBottom: 12 }} />
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C' }}>No tenés alumnos asignados</h3>
        <p style={{ color: '#687768', fontSize: '0.9rem', marginTop: 6 }}>
          Los alumnos inscriptos en tus cursos aparecerán reflejados aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table: Exactly 1 row per student */}
      <div className="desktop-table-view" style={tableContainerStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
              <th style={thStyle}>Alumno</th>
              <th style={thStyle}>Curso</th>
              <th style={thStyle}>DNI</th>
              <th style={thStyle}>Evaluaciones registradas</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {students.map(({ enrollment, student, calificaciones }) => {
              const cursoObj = course(enrollment.cursoId);
              const studentName = student ? `${student.nombre} ${student.apellido}` : 'Estudiante';
              const isExpanded = !!expandedStudents[enrollment.id];

              return (
                <React.Fragment key={enrollment.id}>
                  {/* Single Main Row for this Student */}
                  <tr
                    onClick={() => toggleStudent(enrollment.id)}
                    style={{
                      ...trHoverStyle,
                      cursor: 'pointer',
                      background: isExpanded ? '#FAF3E8' : 'transparent',
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#1F2820' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isExpanded ? <ChevronUp size={16} color="#1F3A60" /> : <ChevronDown size={16} color="#687768" />}
                        <span>{studentName}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{cursoObj?.name || '-'}</td>
                    <td style={tdStyle}>{student?.dni || '-'}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: calificaciones.length > 0 ? 'rgba(31,58,96,0.1)' : 'rgba(129,125,120,0.12)',
                          color: calificaciones.length > 0 ? '#1F3A60' : '#817D78',
                        }}
                      >
                        {calificaciones.length} {calificaciones.length === 1 ? 'nota cargada' : 'notas cargadas'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalificacionFor({ enrollment, student });
                        }}
                        style={btnActionStyle}
                      >
                        <Plus size={15} /> Cargar nota
                      </button>
                    </td>
                  </tr>

                  {/* Collapsible Row: Shows clean grouped list of grades */}
                  {isExpanded && (
                    <tr>
                      <td colSpan="5" style={{ padding: '14px 24px', background: '#FEF7ED', borderBottom: '1px solid rgba(39,60,44,0.12)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#687768', letterSpacing: '0.5px' }}>
                            Historial de notas de {studentName}:
                          </span>

                          {calificaciones.length === 0 ? (
                            <p style={{ fontSize: '0.86rem', color: '#817D78', fontStyle: 'italic', margin: '4px 0' }}>
                              Este alumno aún no tiene calificaciones registradas.
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginTop: 4 }}>
                              {calificaciones.map((g) => (
                                <div
                                  key={g.id}
                                  style={{
                                    background: '#FFFFFF',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    border: '1px solid rgba(39,60,44,0.12)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div>
                                    <strong style={{ fontSize: '0.88rem', color: '#273C2C', display: 'block' }}>
                                      {g.name}
                                    </strong>
                                    {g.description && (
                                      <span style={{ fontSize: '0.78rem', color: '#687768', display: 'block' }}>
                                        {g.description}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.74rem', color: '#817D78' }}>{g.date}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#4A554A', fontWeight: 600 }}>Nota:</span>
                                    <span style={badgeGradeStyle(g.value)}>{g.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Mobile-First): 1 Card per Student with Accordion */}
      <div className="mobile-cards-view">
        {students.map(({ enrollment, student, calificaciones }) => {
          const cursoObj = course(enrollment.cursoId);
          const studentName = student ? `${student.nombre} ${student.apellido}` : 'Estudiante';
          const isExpanded = !!expandedStudents[enrollment.id];

          return (
            <div
              key={enrollment.id}
              style={{
                ...cardMobileStyle,
                background: isExpanded ? '#FAF3E8' : '#FFFFFF',
                cursor: 'pointer',
              }}
              onClick={() => toggleStudent(enrollment.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#273C2C' }}>
                    {studentName}
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: '#1F3A60', fontWeight: 600 }}>
                    {cursoObj?.name || 'Curso'} · DNI: {student?.dni || '-'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCalificacionFor({ enrollment, student });
                  }}
                  style={btnActionStyle}
                >
                  <Plus size={15} /> Calificar
                </button>
              </div>

              {/* Expansion indicator banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(39,60,44,0.1)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4A554A' }}>
                  {calificaciones.length} {calificaciones.length === 1 ? 'nota registrada' : 'notas registradas'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1F3A60', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span>{isExpanded ? 'Ocultar' : 'Ver notas'}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Collapsible List of Notes */}
              {isExpanded && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {calificaciones.length === 0 ? (
                    <p style={{ fontSize: '0.84rem', color: '#817D78', fontStyle: 'italic', margin: '4px 0' }}>
                      Sin calificaciones cargadas aún.
                    </p>
                  ) : (
                    calificaciones.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 10,
                          padding: '10px 14px',
                          border: '1px solid rgba(39,60,44,0.12)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: '#273C2C', display: 'block' }}>{g.name}</strong>
                          {g.description && <span style={{ fontSize: '0.76rem', color: '#687768', display: 'block' }}>{g.description}</span>}
                          <span style={{ fontSize: '0.72rem', color: '#817D78' }}>{g.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.78rem', color: '#4A554A', fontWeight: 600 }}>Nota:</span>
                          <span style={badgeGradeStyle(g.value)}>{g.value}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
};

const badgeGradeStyle = (val) => {
  const num = Number(val);
  const isPassed = num >= 6;
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 800,
    background: isPassed ? 'rgba(46,125,50,0.12)' : 'rgba(211,47,47,0.12)',
    color: isPassed ? '#2E7D32' : '#D32F2F',
  };
};

const btnActionStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 14px',
  borderRadius: 8,
  background: 'rgba(31,58,96,0.1)',
  color: '#1F3A60',
  fontWeight: 700,
  fontSize: '0.82rem',
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

const modalContainer = {
  width: 'min(500px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#FEF7ED',
  border: '2px solid #273C2C',
  borderRadius: 18,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
};

const btnPrimary = {
  background: '#1F3A60',
  color: '#FFFFFF',
  padding: '10px 20px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: '0.92rem',
  boxShadow: '0 4px 12px rgba(31,58,96,0.25)',
};
