import React, { useEffect, useMemo, useState } from 'react';
import { 
  Edit2, Plus, User, X, ChevronDown, Trash2, Search, BookOpen, 
  GraduationCap, Phone, Mail, Calendar, ShieldCheck, CheckCircle2, 
  AlertCircle, Sparkles, Filter 
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';
import { calculateAge, getCourseMetaByAge, getInitials } from '../utils/ageCourse';

const emptyForm = {
  nombre: '',
  apellido: '',
  email: '',
  dni: '',
  telefono: '',
  fechaNacimiento: '',
  cursoId: '',
  rol: 'ALUMNO',
};

export const AdminPage = ({ showToast, onLogout }) => {
  const [activeTab, setActiveTab] = useState('ALUMNO'); // 'ALUMNO' | 'PROFESOR'
  const [state, setState] = useState({ users: [], cursos: [], inscripciones: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadState = async () => {
    setIsLoading(true);
    try {
      const data = await academyService.getState();
      setState(data);
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Filter users by active tab and search query
  const filteredUsers = useMemo(() => {
    const list = (state.users || []).filter((u) => u.rol === activeTab);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((u) => {
      const fullName = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const dni = (u.dni || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || dni.includes(q);
    });
  }, [state.users, activeTab, searchQuery]);

  const studentCount = useMemo(() => (state.users || []).filter((u) => u.rol === 'ALUMNO').length, [state.users]);
  const teacherCount = useMemo(() => (state.users || []).filter((u) => u.rol === 'PROFESOR').length, [state.users]);

  // Find course assigned to user
  const getUserCourse = (u) => {
    if (u.rol === 'ALUMNO') {
      const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id);
      return (state.cursos || []).find((c) => c.id === enrollment?.cursoId) || null;
    }
    return (state.cursos || []).find((c) => c.teacherId === u.id) || null;
  };

  const openNew = () => {
    setSelectedUser(null);
    const initialRol = activeTab;
    const defaultCourseId = initialRol === 'PROFESOR' && state.cursos?.length ? String(state.cursos[0].id) : '';
    setForm({
      ...emptyForm,
      rol: initialRol,
      cursoId: defaultCourseId,
    });
    setShowForm(true);
  };

  const openEdit = (u) => {
    const course = getUserCourse(u);
    setForm({
      ...emptyForm,
      ...u,
      cursoId: course ? String(course.id) : '',
    });
    setSelectedUser(null);
    setShowForm(true);
  };

  // Form field change with automatic DOB-to-course calculation
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'dni') {
        updated.dni = value.replace(/\D/g, '');
      }

      // Automatically assign course when birth date is entered/changed
      if (name === 'fechaNacimiento' && updated.rol === 'ALUMNO' && value) {
        const age = calculateAge(value);
        if (age !== null && age >= 4) {
          const meta = getCourseMetaByAge(age);
          if (meta) {
            const match = (state.cursos || []).find(
              (c) => c.name.toLowerCase() === meta.name.toLowerCase() || c.level.toLowerCase() === meta.name.toLowerCase()
            );
            if (match) {
              updated.cursoId = String(match.id);
            }
          }
        }
      }

      // When switching roles in form
      if (name === 'rol') {
        if (value === 'ALUMNO') {
          if (updated.fechaNacimiento) {
            const age = calculateAge(updated.fechaNacimiento);
            const meta = getCourseMetaByAge(age);
            if (meta) {
              const match = (state.cursos || []).find((c) => c.name.toLowerCase() === meta.name.toLowerCase());
              if (match) updated.cursoId = String(match.id);
            }
          } else {
            updated.cursoId = '';
          }
        } else {
          // Default to first available course if instructor
          if (!updated.cursoId && state.cursos?.length) {
            updated.cursoId = String(state.cursos[0].id);
          }
        }
      }

      return updated;
    });
  };

  // Computed age and meta for student birth date
  const birthDateAge = useMemo(() => {
    if (form.rol === 'ALUMNO' && form.fechaNacimiento) {
      return calculateAge(form.fechaNacimiento);
    }
    return null;
  }, [form.fechaNacimiento, form.rol]);

  const assignedCourseMeta = useMemo(() => {
    if (birthDateAge !== null && birthDateAge >= 4) {
      return getCourseMetaByAge(birthDateAge);
    }
    return null;
  }, [birthDateAge]);

  const currentCourseObj = useMemo(() => {
    if (!form.cursoId) return null;
    return (state.cursos || []).find((c) => String(c.id) === String(form.cursoId));
  }, [form.cursoId, state.cursos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (form.rol === 'ALUMNO') {
        if (!form.fechaNacimiento) {
          throw new Error('La fecha de nacimiento es obligatoria para el alumno.');
        }
        if (birthDateAge !== null && birthDateAge < 4) {
          throw new Error('El alumno debe tener al menos 4 años de edad.');
        }
        if (!form.cursoId) {
          throw new Error('No se ha podido asignar un curso automáticamente. Verificá la fecha de nacimiento.');
        }
      } else if (form.rol === 'PROFESOR') {
        if (!form.cursoId) {
          throw new Error('Por favor seleccioná un curso a cargo para el profesor.');
        }
      }

      if (form.id) {
        await academyService.updateUser(form.id, form);
        showToast('success', `${form.rol === 'ALUMNO' ? 'Alumno' : 'Profesor'} actualizado correctamente.`);
      } else if (form.rol === 'ALUMNO') {
        await academyService.registerStudent(form);
        showToast('success', 'Alumno registrado exitosamente y vinculado a su curso.');
      } else {
        await academyService.registerTeacher(form);
        showToast('success', 'Profesor registrado exitosamente y asignado al curso.');
      }
      setShowForm(false);
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await academyService.deleteUser(userToDelete.id);
      showToast('success', `${userToDelete.rol === 'ALUMNO' ? 'Alumno' : 'Profesor'} ${userToDelete.nombre} ${userToDelete.apellido} eliminado.`);
      setUserToDelete(null);
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
      await loadState();
    } catch (err) {
      showToast('error', err.message || 'Error al eliminar usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamic modal header title without static "Register Student" bug
  const modalTitle = useMemo(() => {
    if (form.id) {
      return form.rol === 'ALUMNO' ? 'Editar Alumno' : 'Editar Profesor';
    }
    return form.rol === 'ALUMNO' ? 'Registrar Alumno' : 'Registrar Profesor';
  }, [form.id, form.rol]);

  return (
    <main style={{ minHeight: '100vh', background: '#FEF7ED', color: '#1F2820' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          height: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 max(5vw, 24px)',
          background: '#FEF7ED',
          borderBottom: '1px solid rgba(39,60,44,0.12)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={logoImg}
            alt="Logo Cultural Inglesa de Oxford"
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }}
          />
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#273C2C',
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              CULTURAL INGLESA DE OXFORD
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 600, letterSpacing: '0.5px' }}>
              PANEL DE GESTIÓN ACADÉMICA
            </span>
          </div>
        </div>

        {/* User profile dropdown button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 24,
              border: '1px solid rgba(39,60,44,0.2)',
              background: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: '#273C2C',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1F3A60',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
              }}
            >
              AD
            </div>
            <span>Administrador</span>
            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 48,
                zIndex: 50,
                background: '#FFFFFF',
                border: '1px solid rgba(39,60,44,0.2)',
                borderRadius: 12,
                padding: 6,
                minWidth: 180,
                boxShadow: 'var(--shadow-md)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#D32F2F',
                  fontWeight: 700,
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
      <div style={{ width: 'min(1180px, 92%)', margin: '0 auto', padding: '36px 0 60px' }}>
        
        {/* Controls Bar: Tabs + Search + CTA */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 18,
            marginBottom: 28,
          }}
        >
          {/* Segmented Pill Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: '#EFE7DA',
              padding: 4,
              borderRadius: 14,
              border: '1px solid rgba(39,60,44,0.1)',
            }}
          >
            <button
              onClick={() => { setActiveTab('ALUMNO'); setSearchQuery(''); }}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.92rem',
                background: activeTab === 'ALUMNO' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'ALUMNO' ? '#273C2C' : '#687768',
                boxShadow: activeTab === 'ALUMNO' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GraduationCap size={18} />
              Alumnos
              <span
                style={{
                  background: activeTab === 'ALUMNO' ? '#273C2C' : '#DCD3C5',
                  color: activeTab === 'ALUMNO' ? '#FFFFFF' : '#4A554A',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                }}
              >
                {studentCount}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('PROFESOR'); setSearchQuery(''); }}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.92rem',
                background: activeTab === 'PROFESOR' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'PROFESOR' ? '#273C2C' : '#687768',
                boxShadow: activeTab === 'PROFESOR' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <BookOpen size={18} />
              Profesores
              <span
                style={{
                  background: activeTab === 'PROFESOR' ? '#273C2C' : '#DCD3C5',
                  color: activeTab === 'PROFESOR' ? '#FFFFFF' : '#4A554A',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                }}
              >
                {teacherCount}
              </span>
            </button>
          </div>

          {/* Right Controls: Search bar + Add Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexGrow: 1, justifyContent: 'flex-end' }}>
            <div
              style={{
                position: 'relative',
                minWidth: 'min(280px, 100%)',
              }}
            >
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8A998A',
                }}
              />
              <input
                type="text"
                placeholder={`Buscar ${activeTab === 'ALUMNO' ? 'alumno' : 'profesor'} por nombre, DNI...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 12,
                  border: '1px solid rgba(39,60,44,0.2)',
                  background: '#FFFFFF',
                  fontSize: '0.88rem',
                  color: '#1F2820',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8A998A',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={openNew}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#1F3A60',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.92rem',
                boxShadow: '0 4px 12px rgba(31,58,96,0.22)',
              }}
            >
              <Plus size={18} />
              {activeTab === 'ALUMNO' ? 'Registrar Alumno' : 'Registrar Profesor'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              padding: 48,
              textAlign: 'center',
              border: '1px solid rgba(39,60,44,0.12)',
            }}
          >
            <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #1F3A60', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: 14, color: '#687768', fontWeight: 600 }}>Cargando registros del instituto...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredUsers.length === 0 ? (
          /* Empty State */
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '60px 24px',
              textAlign: 'center',
              border: '1.5px dashed rgba(39,60,44,0.25)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#FAF3E8',
                color: '#273C2C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {activeTab === 'ALUMNO' ? <GraduationCap size={28} /> : <BookOpen size={28} />}
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C', marginBottom: 8 }}>
              {searchQuery ? 'No se encontraron resultados' : `No hay ${activeTab.toLowerCase()}s registrados`}
            </h3>
            <p style={{ color: '#687768', fontSize: '0.92rem', maxWidth: 420, margin: '0 auto 20px' }}>
              {searchQuery
                ? `No encontramos registros que coincidan con "${searchQuery}". Probá con otro término.`
                : `Comenzá dando de alta el primer ${activeTab === 'ALUMNO' ? 'alumno' : 'profesor'} del instituto.`}
            </p>
            {!searchQuery && (
              <button
                onClick={openNew}
                style={{
                  background: '#1F3A60',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                + Registrar {activeTab === 'ALUMNO' ? 'Alumno' : 'Profesor'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div
              className="desktop-table-view"
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                border: '1px solid rgba(39,60,44,0.14)',
                boxShadow: '0 4px 20px rgba(39,60,44,0.05)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF6EE', borderBottom: '1.5px solid rgba(39,60,44,0.12)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', letterSpacing: '0.5px' }}>
                      USUARIO
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', letterSpacing: '0.5px' }}>
                      DNI
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', letterSpacing: '0.5px' }}>
                      TELÉFONO
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', letterSpacing: '0.5px' }}>
                      CURSO ASIGNADO
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', letterSpacing: '0.5px' }}>
                      ESTADO
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', letterSpacing: '0.5px', textAlign: 'right' }}>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => {
                    const course = getUserCourse(u);
                    const initials = getInitials(u.nombre, u.apellido);
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        style={{
                          background: isEven ? '#FFFFFF' : '#FCFAF6',
                          borderBottom: '1px solid rgba(39,60,44,0.08)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F6F0E4')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? '#FFFFFF' : '#FCFAF6')}
                      >
                        {/* User with Avatar */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: u.rol === 'ALUMNO' ? '#E5EFE5' : '#E2EAF5',
                                color: u.rol === 'ALUMNO' ? '#273C2C' : '#1F3A60',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                border: '1px solid rgba(39,60,44,0.1)',
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1F2820' }}>
                                {u.nombre} {u.apellido}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#687768' }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* DNI */}
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              fontSize: '0.86rem',
                              color: '#273C2C',
                              background: '#F0EBE0',
                              padding: '3px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {u.dni || '-'}
                          </span>
                        </td>

                        {/* Teléfono */}
                        <td style={{ padding: '14px 20px', fontSize: '0.88rem', color: '#4A554A' }}>
                          {u.telefono || '-'}
                        </td>

                        {/* Curso Badge */}
                        <td style={{ padding: '14px 20px' }}>
                          {course ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#E8F1FC',
                                color: '#1F3A60',
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: '0.82rem',
                                fontWeight: 700,
                              }}
                            >
                              <BookOpen size={14} />
                              {course.name} ({course.level})
                            </div>
                          ) : (
                            <span style={{ color: '#8A998A', fontSize: '0.85rem' }}>Sin asignar</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#E8F5E9',
                              color: '#1B5E20',
                              padding: '3px 10px',
                              borderRadius: 14,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2E7D32' }} />
                            Activo
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEdit(u)}
                              title="Editar usuario"
                              aria-label={`Editar ${u.nombre}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                border: '1px solid rgba(39,60,44,0.18)',
                                background: '#FFFFFF',
                                color: '#273C2C',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              title="Eliminar usuario"
                              aria-label={`Eliminar ${u.nombre}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                border: '1px solid rgba(211,47,47,0.25)',
                                background: '#FFF5F5',
                                color: '#D32F2F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px, Mobile-First) */}
            <div className="mobile-cards-view">
              {filteredUsers.map((u) => {
                const course = getUserCourse(u);
                const initials = getInitials(u.nombre, u.apellido);

                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      padding: 18,
                      border: '1px solid rgba(39,60,44,0.12)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: u.rol === 'ALUMNO' ? '#E5EFE5' : '#E2EAF5',
                            color: u.rol === 'ALUMNO' ? '#273C2C' : '#1F3A60',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1F2820' }}>
                            {u.nombre} {u.apellido}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#687768' }}>{u.email}</div>
                        </div>
                      </div>

                      <span
                        style={{
                          background: '#E8F5E9',
                          color: '#1B5E20',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        Activo
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: '0.8rem', background: '#F0EBE0', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                        DNI: {u.dni || '-'}
                      </span>
                      {u.telefono && (
                        <span style={{ fontSize: '0.8rem', color: '#4A554A', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} /> {u.telefono}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(39,60,44,0.08)' }}>
                      <div>
                        {course ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#E8F1FC',
                              color: '#1F3A60',
                              padding: '3px 8px',
                              borderRadius: 14,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            <BookOpen size={12} /> {course.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#8A998A' }}>Sin curso</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(u)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(39,60,44,0.2)',
                            background: '#FFFFFF',
                            color: '#273C2C',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button
                          onClick={() => setUserToDelete(u)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(211,47,47,0.25)',
                            background: '#FFF5F5',
                            color: '#D32F2F',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Streamlined Vertical Registration & Edit Modal */}
      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              maxHeight: '90vh',
              background: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(39,60,44,0.18)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(39,60,44,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAF6EE',
              }}
            >
              <div>
                <h2
                  id="modal-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.28rem',
                    fontWeight: 700,
                    color: '#273C2C',
                    margin: 0,
                  }}
                >
                  {modalTitle}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#687768' }}>
                  {form.id ? 'Modificá los datos del registro.' : 'Completá los campos para el alta en el sistema.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Cerrar ventana"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#687768',
                  background: 'transparent',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Vertical Form Body */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: '22px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Role Selector Tabs (Only when creating new user) */}
              {!form.id && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 6 }}>
                    Tipo de Registro *
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      background: '#F0EBE0',
                      padding: 4,
                      borderRadius: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleFormChange({ target: { name: 'rol', value: 'ALUMNO' } })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        background: form.rol === 'ALUMNO' ? '#FFFFFF' : 'transparent',
                        color: form.rol === 'ALUMNO' ? '#273C2C' : '#687768',
                        boxShadow: form.rol === 'ALUMNO' ? 'var(--shadow-sm)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <GraduationCap size={16} /> Alumno
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormChange({ target: { name: 'rol', value: 'PROFESOR' } })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        background: form.rol === 'PROFESOR' ? '#FFFFFF' : 'transparent',
                        color: form.rol === 'PROFESOR' ? '#273C2C' : '#687768',
                        boxShadow: form.rol === 'PROFESOR' ? 'var(--shadow-sm)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <BookOpen size={16} /> Profesor
                    </button>
                  </div>
                </div>
              )}

              {/* Personal Info: Paired Name & Surname */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                <div>
                  <label htmlFor="input-nombre" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                    Nombre *
                  </label>
                  <input
                    id="input-nombre"
                    name="nombre"
                    type="text"
                    value={form.nombre}
                    onChange={handleFormChange}
                    required
                    placeholder="Ej. Lucas"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid rgba(39,60,44,0.22)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="input-apellido" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                    Apellido *
                  </label>
                  <input
                    id="input-apellido"
                    name="apellido"
                    type="text"
                    value={form.apellido}
                    onChange={handleFormChange}
                    required
                    placeholder="Ej. Gómez"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid rgba(39,60,44,0.22)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* DNI */}
              <div>
                <label htmlFor="input-dni" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                  DNI (Solo números) *
                </label>
                <input
                  id="input-dni"
                  name="dni"
                  type="text"
                  value={form.dni}
                  onChange={handleFormChange}
                  required
                  placeholder="Ej. 42123456"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid rgba(39,60,44,0.22)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="input-email" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                  Correo Electrónico *
                </label>
                <input
                  id="input-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  placeholder="ejemplo@correo.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid rgba(39,60,44,0.22)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="input-telefono" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                  Teléfono de Contacto
                </label>
                <input
                  id="input-telefono"
                  name="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={handleFormChange}
                  placeholder="Ej. 11 6180-2607"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid rgba(39,60,44,0.22)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Academic Details - Conditional by Role */}
              {form.rol === 'ALUMNO' ? (
                /* Alumno: Fecha de nacimiento & Curso Asignado Automáticamente */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4, borderTop: '1px solid rgba(39,60,44,0.1)' }}>
                  <div>
                    <label htmlFor="input-fechaNacimiento" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                      Fecha de Nacimiento del Alumno *
                    </label>
                    <input
                      id="input-fechaNacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={form.fechaNacimiento}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1.5px solid rgba(39,60,44,0.22)',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Pre-selected Course Preview Card (No annoying confirmation alert!) */}
                  {form.fechaNacimiento && (
                    <div
                      style={{
                        background: birthDateAge !== null && birthDateAge >= 4 ? '#F4F9F4' : '#FFF5F5',
                        border: `1.5px solid ${birthDateAge !== null && birthDateAge >= 4 ? '#A7D7A9' : '#FFCDD2'}`,
                        borderRadius: 12,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: birthDateAge !== null && birthDateAge >= 4 ? '#2E7D32' : '#D32F2F',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {birthDateAge !== null && birthDateAge >= 4 ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      </div>

                      <div style={{ flexGrow: 1 }}>
                        {birthDateAge !== null && birthDateAge >= 4 ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7D32', fontWeight: 800 }}>
                                CURSO PRESELECCIONADO AUTOMÁTICAMENTE
                              </span>
                              <span style={{ fontSize: '0.75rem', background: '#E8F5E9', color: '#1B5E20', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                                {birthDateAge} años ({assignedCourseMeta?.bracket})
                              </span>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#273C2C', marginTop: 4 }}>
                              {currentCourseObj?.name || assignedCourseMeta?.name}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#4A554A', marginTop: 2 }}>
                              Horario: {currentCourseObj?.schedule || assignedCourseMeta?.schedule}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: 700, color: '#D32F2F', fontSize: '0.9rem' }}>
                              Edad no admitida ({birthDateAge !== null ? `${birthDateAge} años` : 'inválida'})
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#B71C1C', marginTop: 2 }}>
                              El instituto acepta alumnos a partir de los 4 años cumplidos.
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Profesor: Curso a Cargo Selector */
                <div style={{ paddingTop: 4, borderTop: '1px solid rgba(39,60,44,0.1)' }}>
                  <label htmlFor="select-cursoId" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 5 }}>
                    Curso a Cargo del Profesor *
                  </label>
                  <select
                    id="select-cursoId"
                    name="cursoId"
                    value={form.cursoId}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1.5px solid rgba(39,60,44,0.22)',
                      fontSize: '0.9rem',
                      background: '#FFFFFF',
                      outline: 'none',
                    }}
                  >
                    <option value="">Seleccionar curso asignado</option>
                    {(state.cursos || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level}) — {c.schedule}
                      </option>
                    ))}
                  </select>
                  <small style={{ display: 'block', color: '#687768', marginTop: 4, fontSize: '0.78rem' }}>
                    Seleccioná el curso que coordinará este profesor.
                  </small>
                </div>
              )}

              {/* Form Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 10,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(39,60,44,0.1)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#687768',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 10,
                    background: '#1F3A60',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 12px rgba(31,58,96,0.25)',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Guardando...' : form.id ? 'Guardar Cambios' : (form.rol === 'ALUMNO' ? 'Registrar Alumno' : 'Registrar Profesor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Quick Detail Drawer */}
      {selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setSelectedUser(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              marginLeft: 'auto',
              width: 'min(420px, 92vw)',
              height: '100%',
              background: '#FFFFFF',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span
                style={{
                  background: selectedUser.rol === 'ALUMNO' ? '#E5EFE5' : '#E2EAF5',
                  color: selectedUser.rol === 'ALUMNO' ? '#273C2C' : '#1F3A60',
                  padding: '4px 12px',
                  borderRadius: 14,
                  fontSize: '0.78rem',
                  fontWeight: 800,
                }}
              >
                {selectedUser.rol === 'ALUMNO' ? 'ESTUDIANTE' : 'PROFESOR'}
              </span>

              <button onClick={() => setSelectedUser(null)} aria-label="Cerrar detalle">
                <X size={20} color="#687768" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: selectedUser.rol === 'ALUMNO' ? '#273C2C' : '#1F3A60',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                {getInitials(selectedUser.nombre, selectedUser.apellido)}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#273C2C', margin: 0 }}>
                  {selectedUser.nombre} {selectedUser.apellido}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#687768' }}>{selectedUser.email}</span>
              </div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '12px 14px', background: '#FAF6EE', borderRadius: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 700, textTransform: 'uppercase' }}>DNI</span>
                <div style={{ fontWeight: 700, color: '#273C2C', marginTop: 2 }}>{selectedUser.dni || '-'}</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#FAF6EE', borderRadius: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 700, textTransform: 'uppercase' }}>Teléfono</span>
                <div style={{ fontWeight: 700, color: '#273C2C', marginTop: 2 }}>{selectedUser.telefono || '-'}</div>
              </div>

              {selectedUser.fechaNacimiento && (
                <div style={{ padding: '12px 14px', background: '#FAF6EE', borderRadius: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 700, textTransform: 'uppercase' }}>Fecha de Nacimiento</span>
                  <div style={{ fontWeight: 700, color: '#273C2C', marginTop: 2 }}>
                    {selectedUser.fechaNacimiento} ({calculateAge(selectedUser.fechaNacimiento)} años)
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 14px', background: '#FAF6EE', borderRadius: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 700, textTransform: 'uppercase' }}>Curso Asignado</span>
                <div style={{ fontWeight: 700, color: '#1F3A60', marginTop: 2 }}>
                  {getUserCourse(selectedUser)?.name || 'Sin curso'}
                </div>
                {getUserCourse(selectedUser)?.schedule && (
                  <div style={{ fontSize: '0.8rem', color: '#687768', marginTop: 2 }}>
                    {getUserCourse(selectedUser)?.schedule}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => openEdit(selectedUser)}
                style={{
                  flex: 1,
                  background: '#1F3A60',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Edit2 size={16} /> Editar datos
              </button>
              <button
                onClick={() => setUserToDelete(selectedUser)}
                style={{
                  background: '#FFF0F0',
                  color: '#D32F2F',
                  border: '1px solid #FFCDD2',
                  padding: '12px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              padding: 28,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#FFEBEE',
                color: '#D32F2F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#273C2C', marginBottom: 8 }}>
              ¿Eliminar {userToDelete.rol === 'ALUMNO' ? 'alumno' : 'profesor'}?
            </h3>
            <p style={{ color: '#687768', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
              Esta acción eliminará de manera permanente a{' '}
              <strong style={{ color: '#1F2820' }}>{userToDelete.nombre} {userToDelete.apellido}</strong> del sistema.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 700, color: '#687768' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 22px',
                  borderRadius: 8,
                  background: '#D32F2F',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(211,47,47,0.3)',
                }}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
