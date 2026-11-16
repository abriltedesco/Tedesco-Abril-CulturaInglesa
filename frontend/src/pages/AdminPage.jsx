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
  Check,
  Trash2,
  DollarSign,
  ClipboardList,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';
import { calculateAge, getCourseNameByAge } from '../utils/ageCourse';
import { ConfirmModal } from '../components/ConfirmModal';

const emptyForm = { 
  nombre: '', 
  apellido: '', 
  email: '', 
  dni: '', 
  telefono: '', 
  contactoEmergencia: '',
  fechaNacimiento: '', 
  cursoId: '', 
  cursoIds: [], 
  rol: 'ALUMNO' 
};

const emptyCourseForm = {
  name: '',
  level: '',
  capacity: 30,
  days: ['Lunes', 'Miércoles'],
  startTime: '17:00',
  endTime: '18:00',
  prerequisiteLevel: '',
  minAge: 4,
  maxAge: 99
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const AdminPage = ({ showToast, onLogout }) => {
  const [activeTab, setActiveTab] = useState('ALUMNO'); // 'ALUMNO' | 'PROFESOR' | 'CURSOS' | 'INSCRIPCIONES'
  const [state, setState] = useState({ users: [], cursos: [], inscripciones: [], pagos: [] });
  const [form, setForm] = useState(emptyForm); 
  const [showForm, setShowForm] = useState(false); 

  // Modal Curso
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Modal Estado Inscripcion / Pago
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [newEnrollmentState, setNewEnrollmentState] = useState('CONFIRMADA');
  const [passedCondition, setPassedCondition] = useState(true);
  const [showStateModal, setShowStateModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(15000);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Drawer de fechas del ciclo lectivo
  const [cycleCourseId, setCycleCourseId] = useState(null);

  // Drawer de detalle (inscripción / usuario) y filtro por estado
  const [detail, setDetail] = useState(null);
  const [teacherPay, setTeacherPay] = useState(null); // { teacherId, period }
  const [teacherPayAmount, setTeacherPayAmount] = useState(300000);
  const [teacherPayMethod, setTeacherPayMethod] = useState('Transferencia');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  // Modal de Confirmación genérica (para eliminar)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, type: '', id: null, title: '' });

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
      const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id && i.estado !== 'CANCELADA');
      const c = (state.cursos || []).find((course) => course.id === enrollment?.cursoId);
      return c ? [c] : [];
    } else {
      return (state.cursos || []).filter((course) => course.teacherId === u.id);
    }
  };

  // --- Pagos a docentes (control mensual) ---
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const periodLabel = (p) => {
    const [y, m] = p.split('-');
    const name = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
  };
  const getTeacherPayment = (teacherId, period) =>
    (state.pagosDocentes || []).find((p) => p.teacherId === teacherId && p.period === period);
  const pendingTeachers = useMemo(
    () => (state.users || []).filter((u) => u.rol === 'PROFESOR' && !getTeacherPayment(u.id, currentPeriod)),
    [state.users, state.pagosDocentes, currentPeriod]
  );

  const handleTeacherPayment = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await academyService.payTeacher({
        teacherId: teacherPay.teacherId,
        period: teacherPay.period,
        amount: Number(teacherPayAmount),
        method: teacherPayMethod,
      });
      showToast('success', 'Pago al docente registrado.');
      setTeacherPay(null);
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handlers Usuarios ---
  const openNew = () => { 
    setSelected(null); 
    setForm({ ...emptyForm, rol: activeTab, cursoIds: [] }); 
    setShowForm(true); 
  };

  const openEdit = (u) => { 
    const enrollment = (state.inscripciones || []).find((i) => i.alumnoId === u.id && i.estado !== 'CANCELADA'); 
    const profeCursos = (state.cursos || []).filter((c) => c.teacherId === u.id);
    const assignedIds = profeCursos.map((c) => c.id);

    setForm({ 
      ...emptyForm, 
      ...u, 
      contactoEmergencia: u.contactoEmergencia || 'Madre/Padre - Sin especificar',
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

  const submitUser = async (e) => { 
    e.preventDefault(); 
    const emerg = String(form.contactoEmergencia || '').trim();
    if (form.rol === 'ALUMNO' && !emerg) {
      showToast('error', 'El contacto de emergencia es obligatorio para alumnos (VAL-03).');
      return;
    }
    if (form.rol === 'PROFESOR' && (!form.cursoIds || form.cursoIds.length === 0)) {
      showToast('error', 'Por favor seleccioná al menos 1 curso para el profesor.');
      return;
    }

    setIsSaving(true); 
    try {
      const payload = {
        ...form,
        contactoEmergencia: emerg || 'Contacto Familiar'
      };
      if (form.id) {
        await academyService.updateUser(form.id, payload); 
      } else if (form.rol === 'ALUMNO') {
        await academyService.registerStudent(payload); 
      } else {
        await academyService.registerTeacher(payload); 
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

  const handleDeleteUser = async () => {
    if (!confirmDelete.id) return;
    try {
      await academyService.deleteUser(confirmDelete.id);
      showToast('success', 'Usuario eliminado correctamente.');
      setConfirmDelete({ open: false, type: '', id: null, title: '' });
      setSelected(null);
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // --- Handlers Cursos ---
  const openNewCourse = () => {
    setCourseForm(emptyCourseForm);
    setShowCourseModal(true);
  };

  const openEditCourse = (c) => {
    setCourseForm({
      id: c.id,
      name: c.name || '',
      level: c.level || '',
      capacity: c.capacity || 30,
      days: Array.isArray(c.days) ? c.days : ['Lunes', 'Miércoles'],
      startTime: c.startTime || '17:00',
      endTime: c.endTime || '18:00',
      prerequisiteLevel: c.prerequisiteLevel || '',
      minAge: c.minAge || 4,
      maxAge: c.maxAge || 99,
      schedule: c.schedule || ''
    });
    setShowCourseModal(true);
  };

  const toggleCourseDay = (dia) => {
    setCourseForm((prev) => {
      const current = prev.days || [];
      const updated = current.includes(dia)
        ? current.filter((d) => d !== dia)
        : [...current, dia];
      return { ...prev, days: updated };
    });
  };

  const submitCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.days || courseForm.days.length === 0) {
      showToast('error', 'Seleccioná al menos un día de cursada.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...courseForm,
        capacity: Number(courseForm.capacity),
        schedule: `${courseForm.days.join(' y ')} ${courseForm.startTime} a ${courseForm.endTime}`
      };

      if (courseForm.id) {
        await academyService.updateCourse(courseForm.id, payload);
        showToast('success', 'Curso actualizado exitosamente.');
      } else {
        await academyService.createCourse(payload);
        showToast('success', 'Curso creado exitosamente.');
      }
      setShowCourseModal(false);
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirmDelete.id) return;
    try {
      await academyService.deleteCourse(confirmDelete.id);
      showToast('success', 'Curso eliminado exitosamente.');
      setConfirmDelete({ open: false, type: '', id: null, title: '' });
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // --- Handlers Inscripciones & Pagos ---
  const handleUpdateEnrollmentState = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setIsSaving(true);
    try {
      await academyService.updateEnrollmentState(
        selectedEnrollment.id,
        newEnrollmentState,
        newEnrollmentState === 'FINALIZADA' ? passedCondition : null
      );
      showToast('success', 'Estado de inscripción actualizado.');
      setShowStateModal(false);
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCycleAction = async (action, courseId) => {
    setIsSaving(true);
    try {
      if (action === 'start') await academyService.startCycle(courseId);
      else await academyService.finishCycle(courseId);
      showToast('success', action === 'start' ? 'Ciclo lectivo iniciado.' : 'Ciclo finalizado. Las inscripciones pasaron a FINALIZADA.');
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenew = async (enrollment) => {
    setIsSaving(true);
    try {
      await academyService.renewEnrollment(enrollment.id, enrollment.cursoId);
      showToast('success', 'Inscripción renovada para el nuevo período. Quedó pendiente de pago de matrícula.');
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setIsSaving(true);
    try {
      await academyService.payEnrollment({
        enrollmentId: selectedEnrollment.id,
        amount: Number(paymentAmount),
        method: paymentMethod
      });
      showToast('success', 'Pago registrado. La vacante quedó CONFIRMADA.');
      setShowPaymentModal(false);
      await loadState();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const computedStudentCourse = useMemo(() => {
    if (form.rol !== 'ALUMNO' || !form.fechaNacimiento) return null;
    const age = calculateAge(form.fechaNacimiento);
    const courseName = getCourseNameByAge(age);
    const courseObj = (state.cursos || []).find(
      (c) => c.name.toLowerCase() === (courseName || '').toLowerCase()
    );
    return { age, courseName, courseObj };
  }, [form.rol, form.fechaNacimiento, state.cursos]);

  const getEnrollmentBadge = (estado) => {
    switch (estado) {
      case 'CONFIRMADA':
        return { bg: 'rgba(46,125,50,0.12)', color: '#2E7D32', label: 'CONFIRMADA' };
      case 'EN_CURSO':
        return { bg: 'rgba(31,58,96,0.12)', color: '#1F3A60', label: 'EN CURSO' };
      case 'FINALIZADA':
        return { bg: 'rgba(39,60,44,0.1)', color: '#273C2C', label: 'FINALIZADA' };
      case 'CANCELADA':
        return { bg: 'rgba(129,125,120,0.15)', color: '#6B6760', label: 'CANCELADA' };
      default:
        return { bg: '#EAE1D3', color: '#5A4E3A', label: 'PENDIENTE' };
    }
  };

  const ESTADO_FILTROS = [
    ['TODOS', 'Todos'],
    ['PENDIENTE', 'Pendientes'],
    ['CONFIRMADA', 'Confirmadas'],
    ['EN_CURSO', 'En curso'],
    ['FINALIZADA', 'Finalizadas'],
    ['CANCELADA', 'Canceladas'],
  ];

  const filteredEnrollments = useMemo(
    () => (state.inscripciones || []).filter((i) => estadoFilter === 'TODOS' || i.estado === estadoFilter),
    [state.inscripciones, estadoFilter]
  );

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
              PANEL DE ADMINISTRACIÓN GENERAL
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

      {/* Main Container */}
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
          {/* Segmented Control de 4 Tabs */}
          <div
            className="tabs-mobile-stretch"
            style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              background: '#EAE1D3',
              padding: 4,
              borderRadius: 14,
              border: '1px solid rgba(39,60,44,0.15)',
              gap: 4,
            }}
          >
            <button
              onClick={() => setActiveTab('ALUMNO')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'ALUMNO' ? '#273C2C' : 'transparent',
                color: activeTab === 'ALUMNO' ? '#FFFFFF' : '#4A554A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <GraduationCap size={16} />
              Alumnos ({state.users.filter((u) => u.rol === 'ALUMNO').length})
            </button>

            <button
              onClick={() => setActiveTab('PROFESOR')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'PROFESOR' ? '#273C2C' : 'transparent',
                color: activeTab === 'PROFESOR' ? '#FFFFFF' : '#4A554A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Users size={16} />
              Profesores ({state.users.filter((u) => u.rol === 'PROFESOR').length})
            </button>

            <button
              onClick={() => setActiveTab('CURSOS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'CURSOS' ? '#273C2C' : 'transparent',
                color: activeTab === 'CURSOS' ? '#FFFFFF' : '#4A554A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={16} />
              Cursos ({state.cursos.length})
            </button>

            <button
              onClick={() => setActiveTab('INSCRIPCIONES')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'INSCRIPCIONES' ? '#273C2C' : 'transparent',
                color: activeTab === 'INSCRIPCIONES' ? '#FFFFFF' : '#4A554A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ClipboardList size={16} />
              Inscripciones y Pagos ({state.inscripciones.length})
            </button>
          </div>

          {/* New Register Button */}
          {activeTab === 'CURSOS' ? (
            <button
              onClick={openNewCourse}
              className="btn-mobile-stretch"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#1F3A60',
                color: '#FFFFFF',
                padding: '11px 20px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(31,58,96,0.25)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={18} /> Nuevo curso
            </button>
          ) : activeTab === 'ALUMNO' || activeTab === 'PROFESOR' ? (
            <button
              onClick={openNew}
              className="btn-mobile-stretch"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#1F3A60',
                color: '#FFFFFF',
                padding: '11px 20px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(31,58,96,0.25)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={18} /> Registrar {activeTab === 'ALUMNO' ? 'alumno' : 'profesor'}
            </button>
          ) : null}
        </div>

        {/* --- VISTA: TAB CURSOS --- */}
        {activeTab === 'CURSOS' && (
          <div>
            <div className="desktop-table-view" style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
                    <th style={thStyle}>Curso</th>
                    <th style={thStyle}>Nivel</th>
                    <th style={thStyle}>Horario y Días</th>
                    <th style={thStyle}>Cupo</th>
                    <th style={thStyle}>Docente</th>
                    <th style={thStyle}>Correlatividad</th>
                    <th style={thStyle}>Ciclo lectivo</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {state.cursos.map((c) => {
                    const activeCount = (state.inscripciones || []).filter(
                      (i) => i.cursoId === c.id && ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'].includes(i.estado)
                    ).length;
                    const teacher = state.users.find((u) => u.id === c.teacherId);
                    const isFull = activeCount >= c.capacity;

                    return (
                      <tr key={c.id} style={{ ...trHoverStyle, cursor: 'pointer' }} onClick={() => setCycleCourseId(c.id)}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1F2820' }}>{c.name}</td>
                        <td style={tdStyle}>{c.level}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{c.schedule}</span>
                            <small style={{ color: '#687768', fontSize: '0.76rem' }}>
                              {Array.isArray(c.days) ? c.days.join(', ') : ''} ({c.startTime || ''} - {c.endTime || ''})
                            </small>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: isFull ? 'rgba(211,47,47,0.12)' : 'rgba(46,125,50,0.12)',
                            color: isFull ? '#D32F2F' : '#2E7D32'
                          }}>
                            {activeCount} / {c.capacity}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {teacher ? (
                            <span style={{ fontWeight: 600, color: '#1F3A60' }}>
                              {teacher.nombre} {teacher.apellido}
                            </span>
                          ) : (
                            <span style={{ color: '#817D78', fontStyle: 'italic' }}>Sin docente</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {c.prerequisiteLevel ? (
                            <span style={{ fontSize: '0.82rem', background: '#F0EBE0', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                              Req: {c.prerequisiteLevel}
                            </span>
                          ) : (
                            <span style={{ color: '#817D78', fontSize: '0.82rem' }}>Inicial</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCycleCourseId(c.id); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(31,58,96,0.1)', color: '#1F3A60', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <Calendar size={14} /> Ver fechas
                          </button>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => openEditCourse(c)}
                              style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(39,60,44,0.08)', color: '#273C2C', border: 'none', cursor: 'pointer' }}
                              title="Editar curso"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ open: true, type: 'course', id: c.id, title: `el curso ${c.name}` })}
                              style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(211,47,47,0.08)', color: '#D32F2F', border: 'none', cursor: 'pointer' }}
                              title="Eliminar curso"
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
          </div>
        )}

        {/* --- VISTA: TAB INSCRIPCIONES Y PAGOS --- */}
        {activeTab === 'INSCRIPCIONES' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ESTADO_FILTROS.map(([value, label]) => {
                const count = value === 'TODOS'
                  ? state.inscripciones.length
                  : state.inscripciones.filter((i) => i.estado === value).length;
                const active = estadoFilter === value;
                return (
                  <button
                    key={value}
                    onClick={() => setEstadoFilter(value)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      border: '1px solid rgba(39,60,44,0.15)',
                      cursor: 'pointer',
                      background: active ? '#273C2C' : '#EAE1D3',
                      color: active ? '#FFFFFF' : '#4A554A',
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
            <div className="desktop-table-view" style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
                    <th style={thStyle}>Alumno</th>
                    <th style={thStyle}>Curso</th>
                    <th style={thStyle}>Fecha Inscripción</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Condición</th>
                    <th style={thStyle}>Asistencia</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Acciones de Gestión</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', color: '#687768', padding: 32 }}>
                        No hay inscripciones con este estado.
                      </td>
                    </tr>
                  )}
                  {filteredEnrollments.map((ins) => {
                    const student = state.users.find((u) => u.id === ins.alumnoId);
                    const course = state.cursos.find((c) => c.id === ins.cursoId);
                    const badge = getEnrollmentBadge(ins.estado);
                    const isPending = ins.estado === 'PENDIENTE';

                    return (
                      <tr
                        key={ins.id}
                        style={{ ...trHoverStyle, cursor: 'pointer' }}
                        onClick={() => setDetail({ type: 'enrollment', id: ins.id })}
                      >
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1F2820' }}>
                          {student ? `${student.nombre} ${student.apellido}` : 'Alumno ID: ' + ins.alumnoId}
                          <small style={{ display: 'block', color: '#687768', fontWeight: 400 }}>
                            DNI: {student?.dni || '-'}
                          </small>
                        </td>
                        <td style={tdStyle}>{course?.name || 'Curso ID: ' + ins.cursoId}</td>
                        <td style={tdStyle}>{ins.fecha ? new Date(ins.fecha).toLocaleDateString() : '-'}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {ins.estado === 'FINALIZADA' ? (
                            <span style={{
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              color: ins.passed ? '#273C2C' : '#B3463F'
                            }}>
                              {ins.passed ? 'Aprobado' : ins.desaprobadoPorFaltas ? 'Reprobado (faltas)' : 'Reprobado'}
                            </span>
                          ) : (
                            <span style={{ color: '#817D78', fontSize: '0.82rem' }}>En curso</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {ins.estado === 'PENDIENTE' || ins.estado === 'CANCELADA' ? (
                            <span style={{ color: '#817D78' }}>-</span>
                          ) : (
                            <span style={{
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              color: (ins.porcentajeAsistencia ?? 0) >= 70 ? '#273C2C' : '#B3463F'
                            }}>
                              {ins.porcentajeAsistencia ?? 0}% ({ins.asistenciasPresentes ?? 0}/{ins.totalClasesCiclo ?? 25})
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            {isPending && (
                              <button
                                onClick={() => {
                                  setSelectedEnrollment(ins);
                                  setShowPaymentModal(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  background: '#273C2C',
                                  color: '#FFFFFF',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <DollarSign size={14} /> Cobrar matrícula
                              </button>
                            )}

                            {ins.estado === 'FINALIZADA' && (
                              <button
                                onClick={() => handleRenew(ins)}
                                disabled={isSaving}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  background: '#1F3A60',
                                  color: '#FFFFFF',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                Renovar año
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedEnrollment(ins);
                                setNewEnrollmentState(ins.estado);
                                setPassedCondition(ins.passed ?? true);
                                setShowStateModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'rgba(39,60,44,0.08)',
                                color: '#273C2C',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Cambiar estado
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VISTA: TAB ALUMNOS Y PROFESORES --- */}
        {(activeTab === 'ALUMNO' || activeTab === 'PROFESOR') && (
          <div>
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
                {activeTab === 'PROFESOR' && (
                  <div style={{
                    marginBottom: 16,
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: pendingTeachers.length ? '#EAE1D3' : 'rgba(39,60,44,0.08)',
                    border: '1px solid rgba(39,60,44,0.18)',
                    color: '#273C2C',
                  }}>
                    <strong>Control de pagos a docentes · {periodLabel(currentPeriod)}</strong>
                    {pendingTeachers.length === 0 ? (
                      <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>Todos los docentes tienen el pago del mes registrado.</p>
                    ) : (
                      <>
                        <p style={{ margin: '6px 0 10px', fontSize: '0.9rem' }}>
                          Falta registrar el pago de {pendingTeachers.length} {pendingTeachers.length === 1 ? 'docente' : 'docentes'}:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {pendingTeachers.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setTeacherPay({ teacherId: t.id, period: currentPeriod })}
                              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(39,60,44,0.3)', background: '#FEF7ED', color: '#273C2C', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
                            >
                              Pagar a {t.nombre} {t.apellido}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Desktop Table View */}
                <div className="desktop-table-view" style={tableContainerStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#273C2C', color: '#FFFFFF' }}>
                        <th style={thStyle}>DNI</th>
                        <th style={thStyle}>Nombre completo</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Teléfono</th>
                        {activeTab === 'ALUMNO' && <th style={thStyle}>Contacto Emergencia</th>}
                        <th style={thStyle}>{activeTab === 'ALUMNO' ? 'Curso' : 'Cursos asignados'}</th>
                        <th style={thStyle}>{activeTab === 'ALUMNO' ? 'Matrícula' : `Pago ${periodLabel(currentPeriod)}`}</th>
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
                            onClick={() => setDetail({ type: 'user', id: u.id })}
                          >
                            <td style={tdStyle}>{u.dni || '-'}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: '#1F2820' }}>
                              {u.nombre} {u.apellido}
                            </td>
                            <td style={tdStyle}>{u.email}</td>
                            <td style={tdStyle}>{u.telefono || '-'}</td>
                            {activeTab === 'ALUMNO' && (
                              <td style={tdStyle}>
                                <span style={{ fontSize: '0.85rem', color: u.contactoEmergencia ? '#1F3A60' : '#D32F2F', fontWeight: 600 }}>
                                  {u.contactoEmergencia || 'Faltante'}
                                </span>
                              </td>
                            )}
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
                            <td style={tdStyle}>
                              {(() => {
                                let ok;
                                let label;
                                if (u.rol === 'PROFESOR') {
                                  ok = Boolean(getTeacherPayment(u.id, currentPeriod));
                                  label = ok ? 'Pagado' : 'Pendiente';
                                } else {
                                  const own = (state.inscripciones || []).filter((i) => i.alumnoId === u.id && i.estado !== 'CANCELADA');
                                  const owes = own.some((i) => i.estado === 'PENDIENTE');
                                  ok = own.length > 0 && !owes;
                                  label = own.length === 0 ? 'Sin inscripción' : owes ? 'Debe matrícula' : 'Al día';
                                }
                                return (
                                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: ok ? '#273C2C' : '#8A6D1F' }}>{label}</span>
                                );
                              })()}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(u);
                                  }}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(39,60,44,0.08)',
                                    color: '#273C2C',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Edit2 size={15} /> Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete({ open: true, type: 'user', id: u.id, title: `al usuario ${u.nombre} ${u.apellido}` });
                                  }}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(211,47,47,0.08)',
                                    color: '#D32F2F',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                  title="Eliminar usuario"
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

                {/* Mobile Cards View */}
                <div className="mobile-cards-view">
                  {users.map((u) => {
                    const assignedCursos = getCursosForUser(u);
                    return (
                      <div
                        key={u.id}
                        style={cardMobileStyle}
                        onClick={() => setDetail({ type: 'user', id: u.id })}
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
                              border: 'none',
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
                          {u.contactoEmergencia && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2E7D32' }}>
                              <AlertCircle size={15} />
                              <span>Emergencia: {u.contactoEmergencia}</span>
                            </div>
                          )}
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
                                <span style={courseBadgeStyle(null)}>Sin cursos</span>
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
          </div>
        )}
      </section>

      {/* --- MODAL USUARIOS (Alumno / Profesor) --- */}
      {showForm && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={submitUser} className="custom-scrollbar" style={verticalModalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#273C2C' }}>
                  {form.id ? 'Editar usuario' : `Registrar ${form.rol === 'ALUMNO' ? 'alumno' : 'profesor'}`}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#687768', marginTop: 2 }}>
                  Completá los datos requeridos por la institución
                </p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} style={{ color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!form.id && (
                <label style={fieldLabelStyle}>
                  Tipo de usuario *
                  <select
                    name="rol"
                    value={form.rol}
                    onChange={update}
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
                  DNI (solo números) *
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
                  Teléfono
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

              {/* Contacto de Emergencia Obligatorio para Alumnos (VAL-03) */}
              {form.rol === 'ALUMNO' && (
                <label style={fieldLabelStyle}>
                  Contacto de Emergencia (Nombre y Teléfono) * (VAL-03)
                  <input
                    name="contactoEmergencia"
                    type="text"
                    required
                    value={form.contactoEmergencia || ''}
                    onChange={update}
                    placeholder="Ej: Laura Rossi (Madre) - 1144556677"
                    className="custom-text-input"
                  />
                </label>
              )}

              {/* Fecha de Nacimiento */}
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

              {/* Selección de cursos */}
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
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1.5px solid ${isChecked ? '#1F3A60' : 'rgba(39,60,44,0.18)'}`,
                            background: isChecked ? '#FAF3E8' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourseForTeacher(c.id)}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.86rem', color: '#273C2C' }}>{c.name}</strong>
                            <span style={{ fontSize: '0.74rem', color: '#687768' }}>{c.schedule}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(39,60,44,0.1)' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} style={btnPrimary}>
                {isSaving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL GESTIÓN DE CURSO (Crear / Editar) --- */}
      {showCourseModal && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={submitCourse} className="custom-scrollbar" style={verticalModalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#273C2C' }}>
                {courseForm.id ? 'Editar curso' : 'Crear nuevo curso'}
              </h2>
              <button type="button" onClick={() => setShowCourseModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4A554A' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <label style={fieldLabelStyle}>
                  Nombre del curso *
                  <input
                    type="text"
                    required
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="Ej. Inicial 1"
                    className="custom-text-input"
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Nivel académico *
                  <input
                    type="text"
                    required
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    placeholder="Ej. Inicial 1 o A1"
                    className="custom-text-input"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <label style={fieldLabelStyle}>
                  Cupo máximo de alumnos * (RN-01)
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={courseForm.capacity}
                    onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
                    className="custom-text-input"
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Nivel correlativo previo (RN-02)
                  <select
                    value={courseForm.prerequisiteLevel}
                    onChange={(e) => setCourseForm({ ...courseForm, prerequisiteLevel: e.target.value })}
                    className="custom-select"
                  >
                    <option value="">Sin correlatividad previa</option>
                    {(state.cursos || []).map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Días de la semana estructurados */}
              <div>
                <span style={fieldLabelStyle}>Días de cursada * (RN-05)</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {DIAS_SEMANA.map((dia) => {
                    const isChecked = (courseForm.days || []).includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleCourseDay(dia)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: isChecked ? '#1F3A60' : '#FAF3E8',
                          color: isChecked ? '#FFFFFF' : '#273C2C',
                          border: '1.5px solid rgba(39,60,44,0.18)',
                          cursor: 'pointer'
                        }}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horario estructurado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <label style={fieldLabelStyle}>
                  Hora de inicio (HH:MM) *
                  <input
                    type="time"
                    required
                    value={courseForm.startTime}
                    onChange={(e) => setCourseForm({ ...courseForm, startTime: e.target.value })}
                    className="custom-text-input"
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Hora de finalización (HH:MM) *
                  <input
                    type="time"
                    required
                    value={courseForm.endTime}
                    onChange={(e) => setCourseForm({ ...courseForm, endTime: e.target.value })}
                    className="custom-text-input"
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(39,60,44,0.1)' }}>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} style={btnPrimary}>
                {isSaving ? 'Guardando...' : 'Guardar curso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL CAMBIAR ESTADO DE INSCRIPCIÓN --- */}
      {showStateModal && selectedEnrollment && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={handleUpdateEnrollmentState} className="custom-scrollbar" style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>
                Actualizar Estado de Inscripción
              </h2>
              <button type="button" onClick={() => setShowStateModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4A554A' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <label style={fieldLabelStyle}>
                Nuevo estado:
                <select
                  value={newEnrollmentState}
                  onChange={(e) => setNewEnrollmentState(e.target.value)}
                  className="custom-select"
                >
                  <option value="PENDIENTE">1. PENDIENTE (esperando matrícula)</option>
                  <option value="CONFIRMADA">2. CONFIRMADA (matrícula paga, cupo tomado)</option>
                  <option value="EN_CURSO">3. EN CURSO (ciclo lectivo activo)</option>
                  <option value="FINALIZADA">4. FINALIZADA (cierre de cursada)</option>
                  <option value="CANCELADA">5. CANCELADA (baja de vacante)</option>
                </select>
              </label>

              {newEnrollmentState === 'FINALIZADA' && (
                <div style={{ background: '#FAF3E8', padding: 14, borderRadius: 10, border: '1px solid rgba(39,60,44,0.18)' }}>
                  <span style={{ ...fieldLabelStyle, marginBottom: 8, display: 'block' }}>
                    Condición académica final (para correlatividades RN-02):
                  </span>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#2E7D32', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="passed"
                        checked={passedCondition === true}
                        onChange={() => setPassedCondition(true)}
                      />
                      APROBADO
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#D32F2F', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="passed"
                        checked={passedCondition === false}
                        onChange={() => setPassedCondition(false)}
                      />
                      REPROBADO
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowStateModal(false)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} style={btnPrimary}>
                {isSaving ? 'Actualizando...' : 'Confirmar cambio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL COBRAR MATRICULA --- */}
      {showPaymentModal && selectedEnrollment && (
        <div role="dialog" aria-modal="true" style={modalOverlay}>
          <form onSubmit={handleRegisterPayment} className="custom-scrollbar" style={modalContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>
                Registrar Cobro de Matrícula
              </h2>
              <button type="button" onClick={() => setShowPaymentModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4A554A' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <div style={{ background: '#F4F9F4', padding: 12, borderRadius: 10, border: '1px solid #A7D7A9', fontSize: '0.86rem', color: '#2E7D32' }}>
                Al registrar este pago, el estado de la inscripción pasará automáticamente a <strong>CONFIRMADA</strong> y la vacante del alumno quedará asegurada (restando cupo).
              </div>

              <label style={fieldLabelStyle}>
                Monto abonado ($) *
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="custom-text-input"
                />
              </label>

              <label style={fieldLabelStyle}>
                Método de pago *
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="custom-select"
                >
                  <option value="Efectivo">Efectivo por ventanilla</option>
                  <option value="Transferencia">Transferencia bancaria</option>
                  <option value="Débito">Tarjeta de débito</option>
                  <option value="Crédito">Tarjeta de crédito</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} style={btnPrimary}>
                {isSaving ? 'Registrando...' : 'Confirmar pago'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL PAGO A DOCENTE --- */}
      {teacherPay && (() => {
        const t = (state.users || []).find((u) => u.id === teacherPay.teacherId);
        return (
          <div role="dialog" aria-modal="true" style={{ ...modalOverlay, zIndex: 200 }}>
            <form onSubmit={handleTeacherPayment} className="custom-scrollbar" style={modalContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(39,60,44,0.12)', paddingBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#273C2C' }}>
                  Pago a docente · {periodLabel(teacherPay.period)}
                </h2>
                <button type="button" onClick={() => setTeacherPay(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4A554A' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <p style={{ margin: 0, color: '#4A554A' }}>Docente: <strong>{t ? `${t.nombre} ${t.apellido}` : ''}</strong></p>
                <label style={fieldLabelStyle}>
                  Monto abonado ($) *
                  <input type="number" min="1" required value={teacherPayAmount} onChange={(e) => setTeacherPayAmount(e.target.value)} className="custom-text-input" />
                </label>
                <label style={fieldLabelStyle}>
                  Método de pago *
                  <select value={teacherPayMethod} onChange={(e) => setTeacherPayMethod(e.target.value)} className="custom-select">
                    <option value="Transferencia">Transferencia bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setTeacherPay(null)} style={{ padding: '10px 18px', fontWeight: 600, color: '#4A554A', border: 'none', background: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} style={btnPrimary}>
                  {isSaving ? 'Registrando...' : 'Confirmar pago'}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* --- DRAWER: Fechas del ciclo lectivo --- */}
      {cycleCourseId && (() => {
        const course = (state.cursos || []).find((c) => c.id === cycleCourseId);
        if (!course) return null;
        const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-');
        const activeCount = (state.inscripciones || []).filter(
          (i) => i.cursoId === course.id && ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'].includes(i.estado)
        ).length;
        const courseTeacher = (state.users || []).find((u) => u.id === course.teacherId);
        const rows = [
          ['Nivel', course.level],
          ['Horario', course.schedule],
          ['Días', Array.isArray(course.days) ? course.days.join(', ') : '-'],
          ['Docente', courseTeacher ? `${courseTeacher.nombre} ${courseTeacher.apellido}` : 'Sin docente'],
          ['Cupo', `${activeCount} / ${course.capacity}`],
          ['Correlatividad', course.prerequisiteLevel || 'Inicial'],
          ['Rango de edad', `${course.minAge ?? '-'} a ${course.maxAge ?? '-'} años`],
          ['Ciclo lectivo', course.cicloLectivo],
          ['Fecha de inicio', fmt(course.fechaInicio)],
          ['Fecha de finalización', fmt(course.fechaFin)],
          ['Clases programadas', course.totalClases],
          ['Asistencia mínima para aprobar', '70%'],
          ['Estado', course.cicloFinalizado ? 'Finalizado' : course.cicloIniciado ? 'En curso' : 'Sin iniciar'],
        ];
        return (
          <div
            onClick={() => setCycleCourseId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(420px, 100%)', height: '100%', background: '#FEF7ED', padding: 28, overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', margin: 0 }}>{course.name}</h3>
                <button onClick={() => setCycleCourseId(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>
              <dl style={{ margin: 0, display: 'grid', gap: 14 }}>
                {rows.map(([label, value]) => (
                  <div key={label} style={{ background: '#FAF3E8', border: '1px solid rgba(39,60,44,0.15)', borderRadius: 12, padding: '12px 16px' }}>
                    <dt style={{ fontSize: '0.76rem', color: '#687768', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</dt>
                    <dd style={{ margin: '4px 0 0', fontWeight: 700, color: '#1F2820' }}>{value}</dd>
                  </div>
                ))}
              </dl>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                {!course.cicloIniciado && !course.cicloFinalizado && (
                  <button disabled={isSaving} onClick={() => handleCycleAction('start', course.id)} style={btnPrimary}>Iniciar ciclo</button>
                )}
                {!course.cicloFinalizado && (
                  <button disabled={isSaving} onClick={() => handleCycleAction('finish', course.id)} style={btnPrimary}>Finalizar ciclo</button>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#687768', marginTop: 14 }}>
                Al finalizar el ciclo (o al llegar la fecha de fin) todas las inscripciones pasan a FINALIZADA.
                Quienes no alcancen el 70% de asistencia quedan reprobados.
              </p>
            </aside>
          </div>
        );
      })()}

      {/* --- DRAWER: Detalle de inscripción / usuario --- */}
      {detail && (() => {
        const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-AR') : '-');
        let title = '';
        let rows = [];
        let actions = null;
        let history = [];
        const extra = [];

        if (detail.type === 'enrollment') {
          const ins = (state.inscripciones || []).find((i) => i.id === detail.id);
          if (!ins) return null;
          const student = (state.users || []).find((u) => u.id === ins.alumnoId);
          const course = (state.cursos || []).find((c) => c.id === ins.cursoId);
          const teacher = (state.users || []).find((u) => u.id === course?.teacherId);
          const payments = (state.pagos || []).filter((p) => p.enrollmentId === ins.id);
          const grades = (state.calificaciones || []).filter((g) => g.inscripcionId === ins.id);
          const avg = grades.length ? (grades.reduce((a, g) => a + g.value, 0) / grades.length).toFixed(2) : '-';
          title = student ? `${student.nombre} ${student.apellido}` : `Alumno ${ins.alumnoId}`;
          rows = [
            ['Estado', getEnrollmentBadge(ins.estado).label],
            ['DNI', student?.dni || '-'],
            ['Email', student?.email || '-'],
            ['Teléfono', student?.telefono || '-'],
            ['Contacto de emergencia', student?.contactoEmergencia || '-'],
            ['Curso', course?.name || '-'],
            ['Horario', course?.schedule || '-'],
            ['Docente', teacher ? `${teacher.nombre} ${teacher.apellido}` : 'Sin docente'],
            ['Ciclo lectivo', ins.cicloLectivo],
            ['Fecha de inscripción', fmtDate(ins.fecha)],
            ['Fecha de finalización', fmtDate(ins.fechaFinalizacion)],
            ['Condición', ins.estado === 'FINALIZADA' ? (ins.passed ? 'Aprobado' : ins.desaprobadoPorFaltas ? 'Reprobado por faltas' : 'Reprobado') : 'En curso'],
            ['Asistencia', ['PENDIENTE', 'CANCELADA'].includes(ins.estado) ? '-' : `${ins.porcentajeAsistencia ?? 0}% (${ins.asistenciasPresentes ?? 0} presentes, ${ins.ausencias ?? 0} ausencias de ${ins.totalClasesCiclo ?? course?.totalClases ?? 25} clases)`],
            ['Calificaciones', grades.length ? `${grades.map((g) => g.value).join(', ')} (promedio ${avg})` : 'Sin notas'],
            ['Pagos', payments.length ? payments.map((p) => `$${p.amount} · ${p.method} · ${fmtDate(p.date)}`).join('\n') : 'Sin pagos registrados'],
          ];
          history = ins.historial || [];
          actions = (
            <>
              {ins.estado === 'PENDIENTE' && (
                <button style={btnPrimary} onClick={() => { setSelectedEnrollment(ins); setShowPaymentModal(true); setDetail(null); }}>
                  Cobrar matrícula
                </button>
              )}
              {ins.estado === 'FINALIZADA' && (
                <button style={btnPrimary} disabled={isSaving} onClick={async () => { await handleRenew(ins); setDetail(null); }}>
                  Renovar año
                </button>
              )}
              <button
                style={{ ...btnPrimary, background: 'rgba(39,60,44,0.1)', color: '#273C2C', boxShadow: 'none' }}
                onClick={() => {
                  setSelectedEnrollment(ins);
                  setNewEnrollmentState(ins.estado);
                  setPassedCondition(ins.passed ?? true);
                  setShowStateModal(true);
                  setDetail(null);
                }}
              >
                Cambiar estado
              </button>
            </>
          );
        } else {
          const u = (state.users || []).find((x) => x.id === detail.id);
          if (!u) return null;
          const isTeacher = u.rol === 'PROFESOR';
          const cursos = getCursosForUser(u);
          title = `${u.nombre} ${u.apellido}`;
          rows = [
            ['Rol', isTeacher ? 'Profesor' : 'Alumno'],
            ['DNI', u.dni || '-'],
            ['Email', u.email],
            ['Teléfono', u.telefono || '-'],
            ['Estado de la cuenta', u.estado || 'ACTIVO'],
            ...(isTeacher ? [
              ['Especialidad', u.especialidad || '-'],
            ] : [
              ['Fecha de nacimiento', u.fechaNacimiento ? new Date(u.fechaNacimiento).toLocaleDateString('es-AR') : '-'],
              ['Contacto de emergencia', u.contactoEmergencia || '-'],
            ]),
            [isTeacher ? 'Cursos asignados' : 'Curso', cursos.length ? cursos.map((c) => c.name).join(', ') : 'Sin cursos'],
          ];

          if (isTeacher) {
            const paid = (state.pagosDocentes || [])
              .filter((p) => p.teacherId === u.id)
              .sort((a, b) => b.period.localeCompare(a.period));
            const thisMonth = getTeacherPayment(u.id, currentPeriod);
            rows.push(['Pago de ' + periodLabel(currentPeriod), thisMonth ? `Pagado · $${thisMonth.amount} · ${thisMonth.method} · ${fmtDate(thisMonth.date)}` : 'Pendiente']);
            extra.push({
              title: 'Historial de pagos',
              items: paid.length
                ? paid.map((p) => `${periodLabel(p.period)} · $${p.amount} · ${p.method} · ${fmtDate(p.date)}`)
                : ['Todavía no se registraron pagos a este docente.'],
            });
            actions = (
              <>
                {!thisMonth && (
                  <button style={btnPrimary} onClick={() => setTeacherPay({ teacherId: u.id, period: currentPeriod })}>
                    Registrar pago del mes
                  </button>
                )}
                <button style={{ ...btnPrimary, background: 'rgba(39,60,44,0.1)', color: '#273C2C', boxShadow: 'none' }} onClick={() => { openEdit(u); setDetail(null); }}>Editar</button>
              </>
            );
          } else {
            const own = (state.inscripciones || []).filter((i) => i.alumnoId === u.id);
            const payments = (state.pagos || []).filter((p) => p.alumnoId === u.id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
            const owing = own.filter((i) => i.estado === 'PENDIENTE');
            rows.push(['Estado de pagos', owing.length ? `Debe la matrícula de: ${owing.map((i) => (state.cursos || []).find((c) => c.id === i.cursoId)?.name || '-').join(', ')}` : own.length ? 'Al día' : 'Sin inscripciones']);
            extra.push({
              title: 'Inscripciones',
              items: own.length
                ? own.map((i) => `${(state.cursos || []).find((c) => c.id === i.cursoId)?.name || '-'} · ${i.cicloLectivo} · ${getEnrollmentBadge(i.estado).label}`)
                : ['Sin inscripciones.'],
            });
            extra.push({
              title: 'Historial de pagos',
              items: payments.length
                ? payments.map((p) => `$${p.amount} · ${p.method} · ${fmtDate(p.date)} · ${(state.cursos || []).find((c) => c.id === p.cursoId)?.name || '-'}`)
                : ['Sin pagos registrados.'],
            });
            actions = (
              <>
                {owing[0] && (
                  <button style={btnPrimary} onClick={() => { setSelectedEnrollment(owing[0]); setShowPaymentModal(true); setDetail(null); }}>
                    Cobrar matrícula
                  </button>
                )}
                <button style={{ ...btnPrimary, background: 'rgba(39,60,44,0.1)', color: '#273C2C', boxShadow: 'none' }} onClick={() => { openEdit(u); setDetail(null); }}>Editar</button>
              </>
            );
          }
        }

        return (
          <div
            onClick={() => setDetail(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(460px, 100%)', height: '100%', background: '#FEF7ED', padding: 28, overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', margin: 0 }}>{title}</h3>
                <button onClick={() => setDetail(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>
              <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
                {rows.map(([label, value]) => (
                  <div key={label} style={{ background: '#FAF3E8', border: '1px solid rgba(39,60,44,0.15)', borderRadius: 12, padding: '10px 16px' }}>
                    <dt style={{ fontSize: '0.74rem', color: '#687768', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</dt>
                    <dd style={{ margin: '4px 0 0', fontWeight: 600, color: '#1F2820', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{value}</dd>
                  </div>
                ))}
              </dl>
              {extra.map((sec) => (
                <div key={sec.title} style={{ marginTop: 22 }}>
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', marginBottom: 10 }}>{sec.title}</h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {sec.items.map((it, idx) => (
                      <div key={idx} style={{ border: '1px solid rgba(39,60,44,0.15)', borderRadius: 12, padding: '10px 16px', fontSize: '0.86rem', color: '#1F2820' }}>{it}</div>
                    ))}
                  </div>
                </div>
              ))}
              {history.length > 0 && (
                <div style={{ marginTop: 22 }}>
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C', marginBottom: 10 }}>Períodos anteriores</h4>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {history.map((h, idx) => (
                      <div key={idx} style={{ border: '1px solid rgba(39,60,44,0.15)', borderRadius: 12, padding: '10px 16px', fontSize: '0.86rem', color: '#1F2820' }}>
                        <strong>{h.cicloLectivo} · {h.cursoNombre}</strong>
                        <div style={{ color: '#4A554A' }}>
                          {h.passed ? 'Aprobado' : h.desaprobadoPorFaltas ? 'Reprobado por faltas' : 'Reprobado'} · Asistencia {h.porcentajeAsistencia}%{h.promedioFinal !== null ? ` · Promedio ${h.promedioFinal}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {actions && <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>{actions}</div>}
            </aside>
          </div>
        );
      })()}

      {/* --- CONFIRM MODAL (Eliminar) --- */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title="¿Confirmar eliminación?"
        message={`¿Estás seguro de que querés eliminar ${confirmDelete.title}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar permanentemente"
        cancelText="Volver"
        onConfirm={confirmDelete.type === 'course' ? handleDeleteCourse : handleDeleteUser}
        onCancel={() => setConfirmDelete({ open: false, type: '', id: null, title: '' })}
      />
    </main>
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

const cardMobileStyle = {
  background: '#FAF3E8',
  border: '1.5px solid rgba(39,60,44,0.14)',
  borderRadius: 16,
  padding: '18px 16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const emptyCardStyle = {
  background: '#FAF3E8',
  border: '1.5px dashed rgba(39,60,44,0.25)',
  borderRadius: 20,
  padding: '48px 24px',
  textAlign: 'center',
};

const courseBadgeStyle = (c) => ({
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 6,
  fontSize: '0.78rem',
  fontWeight: 700,
  background: c ? 'rgba(31,58,96,0.1)' : 'rgba(129,125,120,0.12)',
  color: c ? '#1F3A60' : '#817D78',
});

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

const verticalModalContainer = {
  width: 'min(540px, 94vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#FEF7ED',
  borderRadius: 20,
  padding: '24px 28px',
  border: '2px solid #273C2C',
  boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
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
