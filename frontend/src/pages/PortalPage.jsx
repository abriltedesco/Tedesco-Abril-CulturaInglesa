import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, User, X } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';

const th = { padding: '14px 16px', textAlign: 'left', fontSize: '.84rem' };
const td = { padding: '14px 16px', borderBottom: '1px solid rgba(39,60,44,.14)' };
const input = { width: '100%', padding: '10px', marginTop: 5, border: '1px solid #273C2C', borderRadius: 8 };

export const PortalPage = ({ user, onLogout }) => {
  const [state, setState] = useState(null); 
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); 
  const [ContraseniaOpen, setContraseniaOpen] = useState(false);
  const [ContraseniaForm, setContraseniaForm] = useState({ currentContrasenia: '', newContrasenia: '' }); 
  const [calificacionFor, setCalificacionFor] = useState(null); 
  const [calificacion, setCalificacion] = useState({ name: 'Examen 1', description: '', date: new Date().toISOString().slice(0, 10), value: '' });
 
  const load = () => academyService.getState().then(setState).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const courses = state?.cursos || []; 
  const enrollments = state?.inscripciones || [];
  const course = (id) => courses.find((c) => c.id === id); 
  const calificacionesFor = (id) => (state?.calificaciones || []).filter((g) => g.inscripcionId === id);
  const students = useMemo(() => enrollments.map((enrollment) => ({ 
    enrollment, student: state?.users?.find((u) => u.id === enrollment.alumnoId), 
    calificaciones: calificacionesFor(enrollment.id) 
  })), [state]);

  const saveContrasenia = async (e) => { e.preventDefault(); 
    try { 
      await academyService.changeContrasenia(ContraseniaForm); 
      setContraseniaOpen(false); 
      setContraseniaForm({ currentContrasenia: '', newContrasenia: '' }); 
      setError(''); } catch (e2) { setError(e2.message); 
    }};

  const saveCalificacion = async (e) => { 
    e.preventDefault(); 
    try { 
      await academyService.calificacion({ 
        enrollmentId: calificacionFor.enrollment.id, ...calificacion, 
        value: Number(calificacion.value), 
        period: calificacion.name }); 
        setCalificacionFor(null); 
        await load(); 
    } catch (e2) { setError(e2.message); } };
  
  return <main style={{ minHeight: '100vh', background: '#FEF7ED' }}>
    <header style={{ height: 104, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5vw', borderBottom: '1px solid rgba(39,60,44,.15)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><img src={logoImg} alt="Logo Cultural Inglesa de Oxford" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 6 }} /><strong style={{ fontFamily: 'var(--font-serif)', lineHeight: 1.15 }}>CULTURAL INGLESA DE<br />OXFORD</strong></div><div style={{ position: 'relative' }}><button onClick={() => setMenuOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><User size={20} />{user.nombre ? `${user.nombre} ${user.apellido || ''}` : user.email}<ChevronDown size={16} /></button>{menuOpen && <div style={{ position: 'absolute', right: 0, top: 38, zIndex: 5, background: '#FFF', border: '1px solid #273C2C', borderRadius: 10, padding: 8, minWidth: 190 }}><button onClick={() => { setContraseniaOpen(true); setMenuOpen(false); }} style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left', color: '#1F3A60', fontWeight: 700 }}>Editar contraseña</button><button onClick={onLogout} style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left', color: '#1F3A60', fontWeight: 700 }}>Cerrar sesión</button></div>}</div></header>
    <section style={{ width: '84%', maxWidth: 1180, margin: '0 auto', padding: '50px 0' }}><h1 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C' }}>{user.rol === 'ALUMNO' ? 'Mis cursos y calificaciones' : 'Mis alumnos y calificaciones'}</h1>{error && <p style={{ color: '#D32F2F', marginTop: 14 }}>{error}</p>}{!state ? <p style={{ marginTop: 20 }}>Cargando información...</p> : user.rol === 'ALUMNO' ? <tablaEstudiante enrollments={enrollments} course={course} calificacionsFor={calificacionsFor} /> : <tablaProfe students={students} course={course} setcalificacionFor={setcalificacionFor} />}</section>
    {ContraseniaOpen && <div role="dialog" aria-modal="true" style={overlay}><form onSubmit={saveContrasenia} style={modal}><div style={modalHead}><h2>Editar contraseña</h2><button type="button" onClick={() => setContraseniaOpen(false)}><X /></button></div><label style={{ fontWeight: 700 }}>Contraseña actual<input type="Contrasenia" required value={ContraseniaForm.currentContrasenia} onChange={(e) => setContraseniaForm({ ...ContraseniaForm, currentContrasenia: e.target.value })} style={input} /></label><label style={{ fontWeight: 700 }}>Nueva contraseña<input type="Contrasenia" required minLength="6" value={ContraseniaForm.newContrasenia} onChange={(e) => setContraseniaForm({ ...ContraseniaForm, newContrasenia: e.target.value })} style={input} /></label><button style={primary}>Guardar contraseña</button></form></div>}
    {calificacionFor && <div role="dialog" aria-modal="true" style={overlay}><form onSubmit={saveCalificacion} style={modal}><div style={modalHead}><h2>Cargar calificación</h2><button type="button" onClick={() => setCalificacionFor(null)}><X /></button></div><p><strong>{calificacionFor.student?.nombre} {calificacionFor.student?.apellido}</strong></p>{[['name', 'Nombre de evaluación'], ['description', 'Descripción'], ['date', 'Día'], ['value', 'Calificación']].map(([name, label]) => <label key={name} style={{ fontWeight: 700 }}>{label}<input type={name === 'date' ? 'date' : name === 'value' ? 'number' : 'text'} min={name === 'value' ? 0 : undefined} max={name === 'value' ? 10 : undefined} required value={calificacion[name]} onChange={(e) => setCalificacion({ ...calificacion, [name]: e.target.value })} style={input} /></label>)}<button style={primary}>Guardar calificación</button></form></div>}
  </main>;
};

const tablaEstudiante = ({ enrollments, course, calificacionsFor }) => <div style={tableWrap}><table style={table}><thead style={thead}><tr>{['Curso', 'Evaluación', 'Descripción', 'Día', 'Calificación'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{enrollments.length ? enrollments.flatMap((e) => { const calificacions = calificacionsFor(e.id); return (calificacions.length ? calificacions : [null]).map((g, i) => <tr key={`${e.id}-${g?.id || i}`}><td style={td}>{course(e.cursoId)?.name || '-'}</td><td style={td}>{g?.name || 'Sin calificaciones'}</td><td style={td}>{g?.description || '-'}</td><td style={td}>{g?.date || '-'}</td><td style={{ ...td, fontWeight: 800 }}>{g?.value ?? '-'}</td></tr>); }) : <tr><td colSpan="5" style={{ ...td, textAlign: 'center' }}>No tenés cursos asignados.</td></tr>}</tbody></table></div>;
const tablaProfe = ({ students, course, setCalificacionFor }) => <div style={tableWrap}><table style={table}><thead style={thead}><tr>{['Alumno', 'Curso', 'Evaluación', 'Descripción', 'Día', 'Nota', 'Acción'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{students.length ? students.flatMap(({ enrollment, student, calificacions }) => (calificacions.length ? calificacions : [null]).map((g, i) => <tr key={`${enrollment.id}-${g?.id || i}`}><td style={{ ...td, fontWeight: 700 }}>{student ? `${student.nombre} ${student.apellido}` : 'Alumno'}</td><td style={td}>{course(enrollment.cursoId)?.name || '-'}</td><td style={td}>{g?.name || 'Sin calificar'}</td><td style={td}>{g?.description || '-'}</td><td style={td}>{g?.date || '-'}</td><td style={{ ...td, fontWeight: 800 }}>{g?.value ?? '-'}</td><td style={td}><button onClick={() => setCalificacionFor({ enrollment, student })} style={{ color: '#1F3A60', fontWeight: 700 }}><Plus size={16} /> Cargar</button></td></tr>)) : <tr><td colSpan="7" style={{ ...td, textAlign: 'center' }}>No tenés alumnos asignados.</td></tr>}</tbody></table></div>;
const tableWrap = { marginTop: 26, overflowX: 'auto', background: '#FFF', border: '1px solid #273C2C', borderRadius: 18 }; const table = { width: '100%', borderCollapse: 'collapse' }; const thead = { background: '#273C2C', color: '#FFF' }; const overlay = { position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }; const modal = { width: 'min(500px,100%)', background: '#FEF7ED', border: '2px solid #273C2C', borderRadius: 16, padding: 26, display: 'grid', gap: 14 }; const modalHead = { display: 'flex', justifyContent: 'space-between' }; const primary = { background: '#1F3A60', color: '#FFF', padding: 12, borderRadius: 8, fontWeight: 700 };
