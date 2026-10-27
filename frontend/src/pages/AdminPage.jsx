import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, User, X, ChevronDown } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';

const emptyForm = { nombre: '', apellido: '', email: '', dni: '', telefono: '', fechaNacimiento: '', cursoId: '', rol: 'ALUMNO' };
const labels = { nombre: 'Nombre', apellido: 'Apellido', email: 'Email', dni: 'DNI', telefono: 'Teléfono', fechaNacimiento: 'Fecha de nacimiento' };
const cell = { padding: '14px 16px', borderBottom: '1px solid rgba(39,60,44,.16)', fontSize: '.88rem' };
const input = { width: '100%', marginTop: 5, padding: '10px 12px', border: '1px solid #273C2C', borderRadius: 8, background: '#FFF' };

export const AdminPage = ({ showToast, onLogout }) => {
  const [activeTab, setActiveTab] = useState('ALUMNO');
  const [state, setState] = useState({ users: [], cursos: [], inscripciones: [] });
  const [form, setForm] = useState(emptyForm); 
  const [showForm, setShowForm] = useState(false); 
  const [selected, setSelected] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false); 
  const [menuOpen, setMenuOpen] = useState(false);

  const loadState = async () =>
  { setIsLoading(true);
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
  const cursoName = (u) => { const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id); 
  const curso = (state.cursos || []).find((c) => c.id === (activeTab === 'ALUMNO' ? enrollment?.cursoId : (state.cursos || []).find((c) => c.profeId === u.id)?.id)); return curso?.name || 'Sin curso'; };
  const openNew = () => { setSelected(null); setForm({ ...emptyForm, rol: activeTab }); setShowForm(true); };

  const openEdit = (u) => { 
    const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id); 
    const profeCurso = (state.cursos || []).find((c) => c.profeId === u.id);
    setForm({ ...emptyForm, ...u, cursoId: String(u.rol === 'ALUMNO' ? enrollment?.cursoId || '' : profeCurso?.id || '') }); 
    setSelected(null);
    setShowForm(true);
  };

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => 
    { e.preventDefault(); setIsSaving(true); 
      try {
        if (form.id) await academyService.updateUser(form.id, form); 
        else if (form.rol === 'ALUMNO') await academyService.registerStudent(form); 
        else await academyService.registerprofe(form); 
        showToast('success', form.id ? 'Datos actualizados correctamente.' : 'Usuario registrado y vinculado al curso.'); 
        setShowForm(false); 
        await loadState();
      }
      catch (err) {
        showToast('error', err.message);
      } 
      finally { 
        setIsSaving(false); 
      } 
    };

  return <main style={{ minHeight: '100vh', background: '#FEF7ED', color: '#1F2820' }}>
    <header style={{ height: 104, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 5vw', borderBottom: '1px solid rgba(39,60,44,.15)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><img src={logoImg} alt="Logo Cultural Inglesa de Oxford" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 6, border: '1px solid #273C2C' }} /><strong style={{ fontFamily: 'var(--font-serif)', lineHeight: 1.15 }}>CULTURAL INGLESA DE<br />OXFORD</strong></div><div style={{ position: 'relative' }}><button onClick={() => setMenuOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><User size={20} />Administrador<ChevronDown size={16} /></button>{menuOpen && <div style={{ position: 'absolute', right: 0, top: 38, zIndex: 5, background: '#FFF', border: '1px solid #273C2C', borderRadius: 10, padding: 8, minWidth: 170, boxShadow: 'var(--shadow-md)' }}><button onClick={onLogout} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', color: '#1F3A60', fontWeight: 700 }}>Cerrar sesión</button></div>}</div></header>
    <section style={{ width: '84%', maxWidth: 1180, margin: '0 auto', padding: '40px 0 70px' }}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}><button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1F3A60', color: '#FFF', padding: '12px 24px', borderRadius: 12, fontWeight: 700 }}><Plus size={20} />Registrar</button></div><div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}><button onClick={() => setActiveTab('ALUMNO')} style={{ color: activeTab === 'ALUMNO' ? '#273C2C' : '#817D78', fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, borderBottom: activeTab === 'ALUMNO' ? '3px solid #273C2C' : '3px solid transparent' }}>Alumnos</button><span style={{ fontSize: '2rem', color: '#817D78' }}>|</span><button onClick={() => setActiveTab('PROFESOR')} style={{ color: activeTab === 'PROFESOR' ? '#273C2C' : '#817D78', fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, borderBottom: activeTab === 'PROFESOR' ? '3px solid #273C2C' : '3px solid transparent' }}>Profesores</button></div><div style={{ overflowX: 'auto', background: '#FFF', border: '1px solid #273C2C', borderRadius: 24 }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead style={{ background: '#273C2C', color: '#FFF' }}><tr>{['DNI', 'Nombre completo', 'Email', 'Teléfono', 'Curso', 'Acciones'].map((h) => <th key={h} style={{ padding: '15px 16px', textAlign: 'left', fontSize: '.85rem' }}>{h}</th>)}</tr></thead><tbody>{isLoading ? <tr><td colSpan="6" style={{ ...cell, textAlign: 'center' }}>Cargando usuarios...</td></tr> : users.length === 0 ? <tr><td colSpan="6" style={{ ...cell, textAlign: 'center' }}>No hay registros.</td></tr> : users.map((u) => <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(u)}><td style={cell}>{u.dni || '-'}</td><td style={{ ...cell, fontWeight: 700 }}>{u.nombre} {u.apellido}</td><td style={cell}>{u.email}</td><td style={cell}>{u.telefono || '-'}</td><td style={cell}>{cursoName(u)}</td><td style={cell}><button onClick={(e) => { e.stopPropagation(); openEdit(u); }} aria-label="Editar usuario"><Edit2 size={17} color="#273C2C" /></button></td></tr>)}</tbody></table></div></section>
    {showForm && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><form onSubmit={submit} style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#FEF7ED', border: '2px solid #273C2C', borderRadius: 18, padding: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}><div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2>{form.id ? 'Editar usuario' : `Registrar ${form.rol === 'ALUMNO' ? 'alumno' : 'profesor'}`}</h2><button type="button" onClick={() => setShowForm(false)}><X /></button></div>{!form.id && <label style={{ fontWeight: 700 }}>Tipo<select name="rol" value={form.rol} onChange={update} style={input}><option value="ALUMNO">Alumno</option><option value="PROFESOR">Profesor</option></select></label>}{Object.keys(labels).map((key) => <label key={key} style={{ fontWeight: 700 }}>{labels[key]}{key !== 'telefono' && ' *'}<input name={key} type={key === 'email' ? 'email' : key === 'fechaNacimiento' ? 'date' : 'text'} value={form[key] || ''} onChange={update} required={key !== 'telefono' && (key !== 'fechaNacimiento' || form.rol === 'ALUMNO')} style={input} /></label>)}<label style={{ fontWeight: 700, gridColumn: '1/-1' }}>Curso *<select name="cursoId" value={form.cursoId} onChange={update} required style={input}><option value="">Seleccionar curso</option>{(state.cursos || []).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.level}</option>)}</select>{!state.cursos?.length && <small style={{ color: '#D32F2F' }}>No hay cursos disponibles.</small>}</label><div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}><button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', fontWeight: 700 }}>Cancelar</button><button disabled={isSaving} style={{ padding: '10px 24px', background: '#1F3A60', color: '#FFF', borderRadius: 8, fontWeight: 700 }}>{isSaving ? 'Guardando...' : 'Guardar'}</button></div></form></div>}
    {selected && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 15, background: 'rgba(0,0,0,.25)' }} onClick={() => setSelected(null)}><aside onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', width: 'min(430px, 92vw)', height: '100%', background: '#FEF7ED', borderLeft: '2px solid #273C2C', padding: 28, boxShadow: '-8px 0 24px rgba(0,0,0,.15)', animation: 'slideInRight .25s ease-out' }}><button onClick={() => setSelected(null)} style={{ float: 'right' }}><X /></button><h2 style={{ marginBottom: 24 }}>Datos completos</h2>{Object.entries(selected).filter(([key]) => key !== 'password').map(([key, value]) => <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid rgba(39,60,44,.15)' }}><strong>{key}</strong><div>{String(value || '-')}</div></div>)}<button onClick={() => openEdit(selected)} style={{ marginTop: 24, background: '#1F3A60', color: '#FFF', padding: '11px 18px', borderRadius: 8, fontWeight: 700 }}>Editar datos</button></aside></div>}
  </main>;
};
