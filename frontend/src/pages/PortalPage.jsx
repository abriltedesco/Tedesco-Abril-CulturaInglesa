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
  Award,
  CalendarCheck,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';

export const PortalPage = ({ user, onLogout }) => {
  const [state, setState] = useState(null); 
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); 
  const [contraseniaOpen, setContraseniaOpen] = useState(false);
  const [contraseniaForm, setContraseniaForm] = useState({ currentPassword: '', newPassword: '' }); 
  
  // Calificación
  const [calificacionFor, setCalificacionFor] = useState(null); 
  const [editingGrade, setEditingGrade] = useState(null);
  const [calificacion, setCalificacion] = useState({ 
    name: 'Evaluación 1', 
    description: '', 
    date: new Date().toISOString().slice(0, 10), 
    value: '' 
  });

  // Tabs de navegación interna del portal
  const isStudent = user.rol === 'ALUMNO';
  const [activePortalTab, setActivePortalTab] = useState(isStudent ? 'CURSOS' : 'CALIFICACIONES'); // ALUMNO: 'CURSOS' | 'ASISTENCIAS' | 'PAGOS' | DOCENTE: 'CALIFICACIONES' | 'ASISTENCIA'

  // Asistencia (Docente)
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceMarks, setAttendanceMarks] = useState({});

  // Solicitud de inscripción (Alumno)
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState('');

  const load = () => academyService.getState().then(setState).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const courses = state?.cursos || []; 
  const enrollments = state?.inscripciones || [];
  const course = (id) => courses.find((c) => c.id === id); 
  const calificacionesFor = (id) => (state?.calificaciones || []).filter((g) => g.inscripcionId === id);
  const asistenciasFor = (id) => (state?.asistencias || []).filter((a) => a.inscripcionId === id);

  const students = useMemo(() => {
    return enrollments.map((enrollment) => ({ 
      enrollment, 
      student: state?.users?.find((u) => u.id === enrollment.alumnoId), 
      calificaciones: calificacionesFor(enrollment.id),
      asistencias: asistenciasFor(enrollment.id)
    }));
  }, [state]);

  const teacherCourses = useMemo(() => {
    if (isStudent) return [];
    return courses.filter((c) => c.teacherId === user.id || c.isAssigned);
  }, [courses, isStudent, user.id]);

  useEffect(() => {
    if (teacherCourses.length > 0 && !attendanceCourseId) {
      setAttendanceCourseId(String(teacherCourses[0].id));
    }
  }, [teacherCourses, attendanceCourseId]);

  const saveContrasenia = async (e) => { 
    e.preventDefault(); 
    setError('');
    setSuccessMsg('');
    try { 
      await academyService.changePassword(contraseniaForm); 
      setContraseniaOpen(false); 
      setContraseniaForm({ currentPassword: '', newPassword: '' }); 
      setSuccessMsg('¡Contraseña actualizada con éxito!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e2) { 
      setError(e2.message); 
    }
  };

  const openNewGrade = (enrollment, student) => {
    setEditingGrade(null);
    setCalificacion({ name: 'Evaluación 1', description: '', date: new Date().toISOString().slice(0, 10), value: '' });
    setCalificacionFor({ enrollment, student });
  };

  const openEditGrade = (grade, enrollment, student) => {
    setEditingGrade(grade);
    setCalificacion({
      name: grade.name || '',
      description: grade.description || '',
      date: grade.date || new Date().toISOString().slice(0, 10),
      value: String(grade.value)
    });
    setCalificacionFor({ enrollment, student });
  };

  const saveCalificacion = async (e) => { 
    e.preventDefault(); 
    setError('');
    try { 
      if (editingGrade) {
        await academyService.updateGrade(editingGrade.id, {
          ...calificacion,
          value: Number(calificacion.value),
          period: calificacion.name
        });
        setSuccessMsg('Calificación actualizada.');
      } else {
        await academyService.grade({ 
          enrollmentId: calificacionFor.enrollment.id, 
          ...calificacion, 
          value: Number(calificacion.value), 
          period: calificacion.name 
        }); 
        setSuccessMsg('Calificación cargada exitosamente.');
      }
      setTimeout(() => setSuccessMsg(''), 4000);
      setCalificacionFor(null); 
      setEditingGrade(null);
      await load(); 
    } catch (e2) { 
      setError(e2.message); 
    } 
  };

  const deleteCalificacion = async (gradeId) => {
    if (!window.confirm('¿Seguro que querés eliminar esta calificación?')) return;
    try {
      await academyService.deleteGrade(gradeId);
      setSuccessMsg('Calificación eliminada.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  // Guardar asistencia en lote
  const saveAttendanceBatch = async () => {
    const courseEnrollments = enrollments.filter((e) => String(e.cursoId) === String(attendanceCourseId) && ['CONFIRMADA', 'EN_CURSO'].includes(e.estado));
    if (courseEnrollments.length === 0) {
      setError('No hay alumnos inscriptos en este curso.');
      return;
    }
    const records = courseEnrollments.map((e) => ({
      enrollmentId: e.id,
      present: attendanceMarks[e.id] !== undefined ? attendanceMarks[e.id] : true
    }));

    try {
      await academyService.recordAttendance({
        records,
        date: attendanceDate
      });
      setSuccessMsg('Asistencia guardada exitosamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  // Solicitud de inscripción del alumno
  const handleStudentEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourseToEnroll) return;
    try {
      await academyService.enroll({ courseId: Number(selectedCourseToEnroll) });
      setSuccessMsg('¡Inscripción solicitada! El estado quedó PENDIENTE de pago de matrícula.');
      setTimeout(() => setSuccessMsg(''), 5000);
      setShowEnrollModal(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRenew = async (enrollment) => {
    // Aprobó: pasa al siguiente nivel; si no, repite el mismo curso
    const nextCourse = enrollment.passed
      ? courses.find((c) => c.prerequisiteLevel && c.prerequisiteLevel === enrollment.level)
      : null;
    try {
      await academyService.renewEnrollment(enrollment.id, (nextCourse || course(enrollment.cursoId))?.id);
      setSuccessMsg('¡Inscripción renovada! Quedó pendiente de pago de matrícula para el nuevo período.');
      setTimeout(() => setSuccessMsg(''), 5000);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

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
          background: '#FEF7ED',
          borderBottom: '1px solid rgba(39,60,44,0.15)',
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
                background: '#FAF3E8',
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
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
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
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
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
        {isStudent && !enrollments.some((e) => ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'].includes(e.estado)) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button
              onClick={() => setShowEnrollModal(true)}
              style={{
                background: '#1F3A60',
                color: '#FFFFFF',
                padding: '11px 20px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Plus size={16} /> Solicitar nuevo curso
            </button>
          </div>
        )}

        {/* Mensajes de éxito y error accesibles */}
        {successMsg && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', color: '#D32F2F', padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Segmented Tabs internas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {isStudent ? (
            <>
              <button
                onClick={() => setActivePortalTab('CURSOS')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activePortalTab === 'CURSOS' ? '#273C2C' : '#EAE1D3',
                  color: activePortalTab === 'CURSOS' ? '#FFFFFF' : '#4A554A',
                }}
              >
                Mis Cursos y Notas
              </button>
              <button
                onClick={() => setActivePortalTab('ASISTENCIAS')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activePortalTab === 'ASISTENCIAS' ? '#273C2C' : '#EAE1D3',
                  color: activePortalTab === 'ASISTENCIAS' ? '#FFFFFF' : '#4A554A',
                }}
              >
                Mis Asistencias
              </button>
              <button
                onClick={() => setActivePortalTab('PAGOS')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activePortalTab === 'PAGOS' ? '#273C2C' : '#EAE1D3',
                  color: activePortalTab === 'PAGOS' ? '#FFFFFF' : '#4A554A',
                }}
              >
                Historial de Pagos
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActivePortalTab('CALIFICACIONES')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activePortalTab === 'CALIFICACIONES' ? '#273C2C' : '#EAE1D3',
                  color: activePortalTab === 'CALIFICACIONES' ? '#FFFFFF' : '#4A554A',
                }}
              >
                Carga de Calificaciones
              </button>
              <button
                onClick={() => setActivePortalTab('ASISTENCIA')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activePortalTab === 'ASISTENCIA' ? '#273C2C' : '#EAE1D3',
                  color: activePortalTab === 'ASISTENCIA' ? '#FFFFFF' : '#4A554A',
                }}
              >
                Toma de Asistencia
              </button>
            </>
          )}
        </div>

        {/* VISTAS DEL ESTUDIANTE */}
        {isStudent && (
          <div>
            {activePortalTab === 'CURSOS' && (
              <StudentPortalView enrollments={enrollments} course={course} calificacionesFor={calificacionesFor} onRenew={handleRenew} />
            )}

            {activePortalTab === 'ASISTENCIAS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {enrollments.map((e) => {
                  const c = course(e.cursoId);
                  const asists = asistenciasFor(e.id);
                  const total = e.totalClasesCiclo ?? c?.totalClases ?? 25;
                  const presents = e.asistenciasPresentes ?? asists.filter((a) => a.present).length;
                  const pct = e.porcentajeAsistencia ?? 0;

                  return (
                    <div key={e.id} style={{ background: '#FAF3E8', borderRadius: 16, padding: '20px 24px', border: '1.5px solid rgba(39,60,44,0.18)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', margin: 0, fontSize: '1.15rem' }}>
                            {c?.name || 'Curso'}
                          </h3>
                          <span style={{ fontSize: '0.82rem', color: '#687768' }}>{c?.schedule}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: pct >= 70 && !e.desaprobadoPorFaltas ? '#2E7D32' : '#D32F2F' }}>
                            {pct}%
                          </span>
                          <small style={{ display: 'block', fontSize: '0.76rem', color: '#687768' }}>
                            {presents} presentes de {total} clases programadas (mínimo 70%)
                          </small>
                          {e.desaprobadoPorFaltas && (
                            <small style={{ display: 'block', fontSize: '0.76rem', color: '#D32F2F', fontWeight: 700 }}>
                              Reprobado por inasistencias
                            </small>
                          )}
                        </div>
                      </div>

                      {asists.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#817D78', fontSize: '0.88rem', margin: 0 }}>
                          Aún no se registraron asistencias en este curso.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                          {asists.map((a) => (
                            <div key={a.id} style={{ padding: '8px 12px', borderRadius: 8, background: '#FAF3E8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                              <span>{a.date}</span>
                              <span style={{ fontWeight: 700, color: a.present ? '#2E7D32' : '#D32F2F' }}>
                                {a.present ? 'PRESENTE' : 'AUSENTE'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activePortalTab === 'PAGOS' && (
              <div style={{ background: '#FAF3E8', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(39,60,44,0.18)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', fontSize: '1.2rem', marginBottom: 16 }}>
                  Historial de Pagos y Matrículas
                </h3>
                {(!state.pagos || state.pagos.length === 0) ? (
                  <p style={{ fontStyle: 'italic', color: '#817D78', fontSize: '0.9rem' }}>
                    No registrás pagos asentados en ventanilla aún.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Concepto</th>
                        <th style={thStyle}>Monto</th>
                        <th style={thStyle}>Método</th>
                        <th style={thStyle}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.pagos.map((p) => (
                        <tr key={p.id} style={trHoverStyle}>
                          <td style={tdStyle}>{new Date(p.date).toLocaleDateString()}</td>
                          <td style={tdStyle}>Matrícula de Cursada</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#1F3A60' }}>${p.amount}</td>
                          <td style={tdStyle}>{p.method}</td>
                          <td style={tdStyle}>
                            <span style={{ background: 'rgba(46,125,50,0.12)', color: '#2E7D32', padding: '3px 8px', borderRadius: 6, fontWeight: 800, fontSize: '0.78rem' }}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* VISTAS DEL DOCENTE */}
        {!isStudent && (
          <div>
            {activePortalTab === 'CALIFICACIONES' && (
              <TeacherPortalView 
                students={students} 
                course={course} 
                openNewGrade={openNewGrade}
                openEditGrade={openEditGrade}
                deleteCalificacion={deleteCalificacion}
              />
            )}

            {activePortalTab === 'ASISTENCIA' && (
              <div style={{ background: '#FAF3E8', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(39,60,44,0.18)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontWeight: 700, fontSize: '0.86rem', color: '#273C2C' }}>
                    Seleccionar curso:
                    <select
                      value={attendanceCourseId}
                      onChange={(e) => setAttendanceCourseId(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
                    >
                      {teacherCourses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.schedule})</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontWeight: 700, fontSize: '0.86rem', color: '#273C2C' }}>
                    Fecha de clase:
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(39,60,44,0.22)' }}
                    />
                  </label>

                  <button
                    onClick={saveAttendanceBatch}
                    style={{
                      background: '#1F3A60',
                      color: '#FFFFFF',
                      padding: '10px 20px',
                      borderRadius: 8,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Guardar lista de asistencia
                  </button>
                </div>

                {/* Lista de Alumnos del curso seleccionado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {enrollments
                    .filter((e) => String(e.cursoId) === String(attendanceCourseId) && ['CONFIRMADA', 'EN_CURSO'].includes(e.estado))
                    .map((e) => {
                      const st = state?.users?.find((u) => u.id === e.alumnoId);
                      const isPresent = attendanceMarks[e.id] !== undefined ? attendanceMarks[e.id] : true;

                      return (
                        <div
                          key={e.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: '#FAF3E8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#273C2C' }}>{st ? `${st.nombre} ${st.apellido}` : 'Alumno'}</strong>
                            <small style={{ display: 'block', color: '#687768' }}>DNI: {st?.dni || '-'}</small>
                          </div>

                          <AttendanceBadge enrollment={e} />

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => setAttendanceMarks((prev) => ({ ...prev, [e.id]: true }))}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                border: 'none',
                                cursor: 'pointer',
                                background: isPresent ? '#2E7D32' : '#EAE1D3',
                                color: isPresent ? '#FFFFFF' : '#4A554A'
                              }}
                            >
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceMarks((prev) => ({ ...prev, [e.id]: false }))}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                border: 'none',
                                cursor: 'pointer',
                                background: !isPresent ? '#D32F2F' : '#EAE1D3',
                                color: !isPresent ? '#FFFFFF' : '#4A554A'
                              }}
                            >
                              Ausente
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- MODAL EDITAR CONTRASEÑA --- */}
      {contraseniaOpen && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={saveContrasenia} style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>Editar contraseña</h2>
              <button type="button" onClick={() => setContraseniaOpen(false)} style={{ border: 'none', background: 'none', color: '#4A554A', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <label style={fieldLabelStyle}>
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
              <label style={fieldLabelStyle}>
                Nueva contraseña
                <input
                  type="password"
                  required
                  minLength={4}
                  value={contraseniaForm.newPassword}
                  onChange={(e) => setContraseniaForm({ ...contraseniaForm, newPassword: e.target.value })}
                  className="custom-text-input"
                  placeholder="Mínimo 4 caracteres"
                />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setContraseniaOpen(false)} style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" style={btnPrimary}>
                Guardar contraseña
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL CARGAR / EDITAR CALIFICACIÓN --- */}
      {calificacionFor && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={saveCalificacion} style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>
                  {editingGrade ? 'Editar calificación' : 'Cargar calificación'}
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#1F3A60', fontWeight: 600, marginTop: 4 }}>
                  Alumno: {calificacionFor.student?.nombre} {calificacionFor.student?.apellido}
                </p>
              </div>
              <button type="button" onClick={() => setCalificacionFor(null)} style={{ border: 'none', background: 'none', color: '#4A554A', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <label style={fieldLabelStyle}>
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

              <label style={fieldLabelStyle}>
                Descripción o contenido
                <input
                  type="text"
                  value={calificacion.description}
                  onChange={(e) => setCalificacion({ ...calificacion, description: e.target.value })}
                  className="custom-text-input"
                  placeholder="Ej: Tiempos verbales y vocabulario"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <label style={fieldLabelStyle}>
                  Fecha *
                  <input
                    type="date"
                    required
                    value={calificacion.date}
                    onChange={(e) => setCalificacion({ ...calificacion, date: e.target.value })}
                    className="custom-date-input"
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Nota (0 - 10) *
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setCalificacionFor(null)} style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" style={btnPrimary}>
                {editingGrade ? 'Actualizar nota' : 'Guardar calificación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL ALUMNO: SOLICITAR NUEVA INSCRIPCIÓN --- */}
      {showEnrollModal && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={handleStudentEnroll} style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>
                Solicitar Inscripción a un Curso
              </h2>
              <button type="button" onClick={() => setShowEnrollModal(false)} style={{ border: 'none', background: 'none', color: '#4A554A', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <label style={fieldLabelStyle}>
                Seleccioná el curso deseado:
                <select
                  required
                  value={selectedCourseToEnroll}
                  onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
                  className="custom-select"
                >
                  <option value="">-- Cursos disponibles --</option>
                  {(state?.cursos || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.schedule}) - Cupo: {c.capacity}
                    </option>
                  ))}
                </select>
              </label>
              <small style={{ color: '#687768', fontSize: '0.8rem' }}>
                Nota: La solicitud pasará a revisión de cupos (RN-01) y verificación de niveles correlativos aprobados (RN-02).
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setShowEnrollModal(false)} style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" style={btnPrimary}>
                Enviar solicitud
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

/* --- VISTA ESTUDIANTE: CURSOS Y NOTAS --- */
const StudentPortalView = ({ enrollments, course, calificacionesFor, onRenew }) => {
  const [expandedId, setExpandedId] = useState(enrollments[0]?.id || null);

  if (!enrollments.length) {
    return (
      <div style={emptyCardStyle}>
        <BookOpen size={36} color="#687768" style={{ marginBottom: 12 }} />
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C' }}>Aún no tenés cursos inscriptos</h3>
        <p style={{ color: '#687768', fontSize: '0.9rem', marginTop: 6 }}>
          Hacé clic en "Solicitar nuevo curso" para inscribirte.
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
              background: '#FAF3E8',
              borderRadius: 16,
              border: '1.5px solid rgba(39,60,44,0.18)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div
              onClick={() => setExpandedId(isExpanded ? null : e.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                cursor: 'pointer',
                background: isExpanded ? '#FAF3E8' : '#FEF7ED',
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
                    Estado: <strong>{e.estado}</strong> · {list.length} {list.length === 1 ? 'evaluación' : 'evaluaciones'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {e.estado === 'FINALIZADA' && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onRenew(e); }}
                    style={{ padding: '7px 14px', borderRadius: 8, background: '#1F3A60', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}
                  >
                    Renovar año
                  </button>
                )}
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1F3A60' }}>
                  {isExpanded ? 'Ocultar notas' : 'Ver notas'}
                </span>
                {isExpanded ? <ChevronUp size={20} color="#273C2C" /> : <ChevronDown size={20} color="#273C2C" />}
              </div>
            </div>

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
                          background: '#FAF3E8',
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

/* --- Indicador de asistencia (porcentaje sobre clases programadas) --- */
const AttendanceBadge = ({ enrollment }) => {
  const pct = enrollment.porcentajeAsistencia ?? 0;
  const failing = enrollment.desaprobadoPorFaltas || pct < 70;
  return (
    <span
      title={`${enrollment.asistenciasPresentes ?? 0} presentes · ${enrollment.ausencias ?? 0} ausencias de ${enrollment.totalClasesCiclo ?? 25} clases programadas`}
      style={{
        padding: '3px 10px',
        borderRadius: 8,
        fontSize: '0.8rem',
        fontWeight: 700,
        background: failing ? 'rgba(211,47,47,0.12)' : 'rgba(46,125,50,0.12)',
        color: failing ? '#D32F2F' : '#2E7D32',
      }}
    >
      {pct}% · {enrollment.ausencias ?? 0} faltas{enrollment.desaprobadoPorFaltas ? ' (reprobado)' : ''}
    </span>
  );
};

/* --- VISTA DOCENTE: CALIFICACIONES (1 FILA POR ALUMNO + EDICIÓN) --- */
const TeacherPortalView = ({ students, course, openNewGrade, openEditGrade, deleteCalificacion }) => {
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
    <div className="desktop-table-view" style={tableContainerStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
            <th style={thStyle}>Alumno</th>
            <th style={thStyle}>Curso</th>
            <th style={thStyle}>DNI</th>
            <th style={thStyle}>Evaluaciones cargadas</th>
            <th style={thStyle}>Asistencia</th>
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
                        padding: '3px 10px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: calificaciones.length > 0 ? 'rgba(31,58,96,0.1)' : 'rgba(129,125,120,0.12)',
                        color: calificaciones.length > 0 ? '#1F3A60' : '#817D78',
                      }}
                    >
                      {calificaciones.length} notas
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <AttendanceBadge enrollment={enrollment} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewGrade(enrollment, student);
                      }}
                      style={btnActionStyle}
                    >
                      <Plus size={15} /> Calificar
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan="6" style={{ padding: '14px 24px', background: '#FEF7ED', borderBottom: '1px solid rgba(39,60,44,0.12)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#687768' }}>
                          Historial y Edición de notas:
                        </span>

                        {calificaciones.length === 0 ? (
                          <p style={{ fontSize: '0.86rem', color: '#817D78', fontStyle: 'italic', margin: '4px 0' }}>
                            Sin calificaciones cargadas aún.
                          </p>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                            {calificaciones.map((g) => (
                              <div
                                key={g.id}
                                style={{
                                  background: '#FAF3E8',
                                  borderRadius: 10,
                                  padding: '10px 14px',
                                  border: '1px solid rgba(39,60,44,0.12)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <strong style={{ fontSize: '0.88rem', color: '#273C2C', display: 'block' }}>{g.name}</strong>
                                  <span style={{ fontSize: '0.74rem', color: '#817D78' }}>{g.date} · Nota: <strong>{g.value}</strong></span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => openEditGrade(g, enrollment, student)}
                                    style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(31,58,96,0.1)', color: '#1F3A60', border: 'none', cursor: 'pointer' }}
                                    title="Editar nota"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => deleteCalificacion(g.id)}
                                    style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(211,47,47,0.1)', color: '#D32F2F', border: 'none', cursor: 'pointer' }}
                                    title="Eliminar nota"
                                  >
                                    <Trash2 size={13} />
                                  </button>
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
  );
};

/* --- ESTILOS AUXILIARES --- */
const tableContainerStyle = {
  background: '#FAF3E8',
  borderRadius: 18,
  border: '1.5px solid rgba(39,60,44,0.18)',
  overflowX: 'auto',
  boxShadow: 'var(--shadow-sm)',
};

const thStyle = {
  padding: '16px 20px',
  textAlign: 'left',
  fontSize: '0.84rem',
  fontWeight: 700,
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '14px 20px',
  borderBottom: '1px solid rgba(39,60,44,0.08)',
  fontSize: '0.88rem',
  color: '#1F2820',
  whiteSpace: 'nowrap',
};

const trHoverStyle = {
  transition: 'background-color 0.15s ease',
};

const emptyCardStyle = {
  background: '#FAF3E8',
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
  padding: '6px 12px',
  borderRadius: 8,
  background: '#1F3A60',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '0.82rem',
  border: 'none',
  cursor: 'pointer',
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const modalContainer = {
  width: 'min(460px, 94vw)',
  background: '#FEF7ED',
  borderRadius: 20,
  padding: '24px 28px',
  border: '2px solid #273C2C',
  boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
};

const fieldLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  fontWeight: 700,
  fontSize: '0.84rem',
  color: '#273C2C',
};

const btnPrimary = {
  background: '#1F3A60',
  color: '#FFFFFF',
  padding: '10px 20px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: '0.92rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(31,58,96,0.2)',
};
