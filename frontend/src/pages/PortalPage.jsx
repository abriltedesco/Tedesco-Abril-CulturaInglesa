import React, { useEffect, useMemo, useState } from 'react';
import { 
  ChevronDown, Plus, User, X, BookOpen, GraduationCap, 
  Calendar, CheckCircle2, Clock, Award, Key, LogOut, Filter 
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { academyService } from '../services/academyService';
import { getInitials } from '../utils/ageCourse';

export const PortalPage = ({ user, onLogout }) => {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Instructor course selector state (NEVER EMPTY!)
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Grade Modal State
  const [gradeFor, setGradeFor] = useState(null);
  const [grade, setGrade] = useState({
    name: 'Evaluación 1',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    value: '',
  });

  const loadData = () =>
    academyService
      .getState()
      .then((data) => {
        setState(data);
        // Ensure default selected course for instructor if not set
        if (user.rol === 'PROFESOR') {
          const coursesList = data?.cursos || [];
          if (coursesList.length > 0) {
            // Find course assigned to this teacher or default to first
            const myCourse = coursesList.find((c) => c.teacherId === user.id || c.isAssigned);
            setSelectedCourseId((prev) => prev || String(myCourse ? myCourse.id : coursesList[0].id));
          }
        }
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    loadData();
  }, []);

  const courses = state?.cursos || [];
  const enrollments = state?.inscripciones || [];

  const getCourseById = (id) => courses.find((c) => c.id === id);
  const getGradesForEnrollment = (enrollmentId) =>
    (state?.calificaciones || []).filter((g) => g.inscripcionId === enrollmentId);

  // Filter students for instructors by the selected course from dropdown
  const instructorStudents = useMemo(() => {
    if (user.rol !== 'PROFESOR') return [];
    
    // Filter enrollments by selected course
    const relevantEnrollments = selectedCourseId
      ? enrollments.filter((e) => String(e.cursoId) === String(selectedCourseId))
      : enrollments;

    return relevantEnrollments.map((enrollment) => ({
      enrollment,
      student: state?.users?.find((u) => u.id === enrollment.alumnoId),
      grades: getGradesForEnrollment(enrollment.id),
    }));
  }, [enrollments, selectedCourseId, state, user.rol]);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setError('');
    try {
      await academyService.changePassword(passwordForm);
      setPasswordSuccess('Contraseña actualizada correctamente.');
      setTimeout(() => {
        setPasswordOpen(false);
        setPasswordSuccess('');
        setPasswordForm({ currentPassword: '', newPassword: '' });
      }, 1500);
    } catch (e2) {
      setError(e2.message);
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      await academyService.grade({
        enrollmentId: gradeFor.enrollment.id,
        ...grade,
        value: Number(grade.value),
        period: grade.name,
      });
      setGradeFor(null);
      setGrade({
        name: 'Evaluación 1',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        value: '',
      });
      await loadData();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const activeCourseObj = useMemo(() => {
    if (!selectedCourseId) return courses[0] || null;
    return courses.find((c) => String(c.id) === String(selectedCourseId)) || courses[0] || null;
  }, [selectedCourseId, courses]);

  return (
    <main style={{ minHeight: '100vh', background: '#FEF7ED', color: '#1F2820' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: 84,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: '#273C2C', display: 'block', lineHeight: 1.15 }}>
              CULTURAL INGLESA DE OXFORD
            </span>
            <span style={{ fontSize: '0.75rem', color: '#687768', fontWeight: 600, letterSpacing: '0.5px' }}>
              {user.rol === 'PROFESOR' ? 'PORTAL DEL PROFESOR' : 'PORTAL DEL ESTUDIANTE'}
            </span>
          </div>
        </div>

        {/* User Pill Dropdown */}
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
                background: user.rol === 'PROFESOR' ? '#1F3A60' : '#273C2C',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
              }}
            >
              {getInitials(user.nombre, user.apellido)}
            </div>
            <span>{user.nombre ? `${user.nombre} ${user.apellido || ''}` : user.email}</span>
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
                border: '1px solid rgba(39,60,44,0.18)',
                borderRadius: 14,
                padding: 6,
                minWidth: 190,
                boxShadow: 'var(--shadow-md)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <button
                onClick={() => {
                  setPasswordOpen(true);
                  setMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#273C2C',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  borderRadius: 8,
                }}
              >
                <Key size={16} /> Cambiar contraseña
              </button>
              <button
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#D32F2F',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  borderRadius: 8,
                }}
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div style={{ width: 'min(1180px, 92%)', margin: '0 auto', padding: '36px 0 60px' }}>
        
        {/* Banner Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#273C2C', margin: 0 }}>
            {user.rol === 'PROFESOR' ? 'Panel de Profesores' : `Bienvenido/a, ${user.nombre || user.email}`}
          </h2>
          <p style={{ color: '#687768', fontSize: '0.94rem', marginTop: 4 }}>
            {user.rol === 'PROFESOR'
              ? 'Gestioná los cursos asignados, el listado de alumnos y el registro de calificaciones.'
              : 'Consultá tu curso asignado, horarios y seguimiento académico de calificaciones.'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FFEBEE',
              color: '#D32F2F',
              padding: '12px 16px',
              borderRadius: 10,
              marginBottom: 20,
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {!state ? (
          <div style={{ background: '#FFF', borderRadius: 18, padding: 48, textAlign: 'center' }}>
            <p style={{ color: '#687768', fontWeight: 600 }}>Cargando información de tu portal...</p>
          </div>
        ) : user.rol === 'PROFESOR' ? (
          /* ========================================================
             INSTRUCTOR SCREEN: With Dropdown of Assigned Courses
             ======================================================== */
          <div>
            {/* Top Bar with Course Dropdown (NEVER EMPTY) */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                padding: '20px 24px',
                border: '1px solid rgba(39,60,44,0.12)',
                boxShadow: '0 4px 16px rgba(39,60,44,0.05)',
                marginBottom: 26,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#E8F1FC',
                    color: '#1F3A60',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1F3A60' }}>
                    CURSO ASIGNADO / SELECCIONADO
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#273C2C' }}>
                    {activeCourseObj?.name || 'Seleccioná un curso'}
                  </div>
                </div>
              </div>

              {/* Course Selector Dropdown - Explicitly Populated */}
              <div style={{ minWidth: 'min(320px, 100%)' }}>
                <label
                  htmlFor="instructor-course-select"
                  style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4A554A', marginBottom: 4 }}
                >
                  Cambiar curso en vista:
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="instructor-course-select"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #1F3A60',
                      background: '#FFFFFF',
                      color: '#1F2820',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    {courses.length === 0 ? (
                      <option value="">Cargando cursos...</option>
                    ) : (
                      courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.level}) — {c.schedule} {c.teacherId === user.id ? '★ (Asignado a vos)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(39,60,44,0.1)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#687768', textTransform: 'uppercase' }}>
                  Alumnos del Curso
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F3A60', marginTop: 4 }}>
                  {instructorStudents.length}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#4A554A' }}>Inscriptos en {activeCourseObj?.name}</span>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(39,60,44,0.1)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#687768', textTransform: 'uppercase' }}>
                  Horario de Clases
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#273C2C', marginTop: 8 }}>
                  {activeCourseObj?.schedule || 'A coordinar'}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#4A554A' }}>Modalidad presencial</span>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(39,60,44,0.1)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#687768', textTransform: 'uppercase' }}>
                  Nivel Académico
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#273C2C', marginTop: 6 }}>
                  {activeCourseObj?.level || 'General'}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#2E7D32', fontWeight: 600 }}>Seguimiento activo</span>
              </div>
            </div>

            {/* Students Table for Instructor */}
            <TeacherTableView
              students={instructorStudents}
              activeCourse={activeCourseObj}
              onGrade={(data) => setGradeFor(data)}
            />
          </div>
        ) : (
          /* ========================================================
             STUDENT SCREEN: Clean Overview & Academic Grades
             ======================================================== */
          <div>
            <StudentPortalView
              enrollments={enrollments}
              getCourseById={getCourseById}
              getGrades={getGradesForEnrollment}
            />
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {passwordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              width: 'min(440px, 100%)',
              background: '#FFFFFF',
              borderRadius: 18,
              padding: 24,
              boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#273C2C', margin: 0 }}>
                Cambiar Contraseña
              </h3>
              <button onClick={() => setPasswordOpen(false)}>
                <X size={18} color="#687768" />
              </button>
            </div>

            {passwordSuccess && (
              <div style={{ background: '#E8F5E9', color: '#1B5E20', padding: 10, borderRadius: 8, fontSize: '0.88rem', marginBottom: 14 }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 4 }}>
                  Contraseña actual *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(39,60,44,0.25)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 4 }}>
                  Nueva contraseña *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(39,60,44,0.25)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  style={{ padding: '8px 16px', fontWeight: 700, color: '#687768' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    background: '#1F3A60',
                    color: '#FFF',
                    fontWeight: 700,
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal for Instructor */}
      {gradeFor && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              width: 'min(480px, 100%)',
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 26,
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1F3A60', textTransform: 'uppercase' }}>
                  REGISTRO DE CALIFICACIÓN
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#273C2C', margin: '2px 0 0' }}>
                  {gradeFor.student?.nombre} {gradeFor.student?.apellido}
                </h3>
              </div>
              <button onClick={() => setGradeFor(null)}>
                <X size={20} color="#687768" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 4 }}>
                  Nombre de la Evaluación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Parcial 1, Listening, Speaking..."
                  value={grade.name}
                  onChange={(e) => setGrade({ ...grade, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(39,60,44,0.25)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 4 }}>
                  Descripción / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej. Examen de gramática y vocabulario Unidad 1"
                  value={grade.description}
                  onChange={(e) => setGrade({ ...grade, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(39,60,44,0.25)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 4 }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={grade.date}
                    onChange={(e) => setGrade({ ...grade, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(39,60,44,0.25)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#273C2C', marginBottom: 4 }}>
                    Nota (0 al 10) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    placeholder="Ej. 8.5"
                    value={grade.value}
                    onChange={(e) => setGrade({ ...grade, value: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #1F3A60', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setGradeFor(null)}
                  style={{ padding: '9px 16px', fontWeight: 700, color: '#687768' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    background: '#1F3A60',
                    color: '#FFF',
                    fontWeight: 700,
                  }}
                >
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

/* =========================================================================
   Instructor Students & Grades View (Redesigned with Desktop & Mobile View)
   ========================================================================= */
const TeacherTableView = ({ students, activeCourse, onGrade }) => {
  const rows = students.flatMap(({ enrollment, student, grades }) => {
    if (grades.length === 0) {
      return [{ enrollment, student, grade: null }];
    }
    return grades.map((grade) => ({ enrollment, student, grade }));
  });

  if (students.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
          border: '1.5px dashed rgba(39,60,44,0.2)',
        }}
      >
        <GraduationCap size={40} color="#687768" style={{ marginBottom: 12 }} />
        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#273C2C', margin: '0 0 6px' }}>
          No hay alumnos inscriptos en este curso
        </h4>
        <p style={{ color: '#687768', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto' }}>
          Cuando se inscriban alumnos a <strong>{activeCourse?.name}</strong>, aparecerán aquí para registrar su seguimiento.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop View */}
      <div
        className="desktop-table-view"
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid rgba(39,60,44,0.12)',
          boxShadow: '0 4px 20px rgba(39,60,44,0.05)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#FAF6EE', borderBottom: '1.5px solid rgba(39,60,44,0.12)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>ALUMNO</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>CURSO</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>EVALUACIÓN</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>OBSERVACIONES</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>FECHA</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', textAlign: 'center' }}>NOTA</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', textAlign: 'right' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ enrollment, student, grade }, idx) => {
              const initials = getInitials(student?.nombre, student?.apellido);
              const score = grade?.value;
              const isEven = idx % 2 === 0;

              return (
                <tr
                  key={`${enrollment.id}-${grade?.id || idx}`}
                  style={{
                    background: isEven ? '#FFFFFF' : '#FCFAF6',
                    borderBottom: '1px solid rgba(39,60,44,0.08)',
                  }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: '#E5EFE5',
                          color: '#273C2C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1F2820' }}>
                          {student?.nombre} {student?.apellido}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#687768' }}>{student?.email}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A60' }}>
                    {activeCourse?.name || 'Curso'}
                  </td>

                  <td style={{ padding: '14px 20px', fontSize: '0.88rem', fontWeight: 600, color: '#273C2C' }}>
                    {grade?.name || <span style={{ color: '#8A998A' }}>Sin calificar</span>}
                  </td>

                  <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: '#4A554A' }}>
                    {grade?.description || '-'}
                  </td>

                  <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: '#4A554A' }}>
                    {grade?.date || '-'}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {score !== undefined && score !== null ? (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          background: score >= 7 ? '#E8F5E9' : score >= 4 ? '#FFF8E1' : '#FFEBEE',
                          color: score >= 7 ? '#2E7D32' : score >= 4 ? '#F57F17' : '#D32F2F',
                        }}
                      >
                        {score}
                      </span>
                    ) : (
                      <span style={{ color: '#8A998A', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => onGrade({ enrollment, student })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#1F3A60',
                        color: '#FFFFFF',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      <Plus size={14} /> Calificar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="mobile-cards-view">
        {rows.map(({ enrollment, student, grade }, idx) => (
          <div
            key={`${enrollment.id}-${grade?.id || idx}`}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(39,60,44,0.12)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                {student?.nombre} {student?.apellido}
              </div>
              {grade?.value !== undefined && grade?.value !== null && (
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    background: grade.value >= 7 ? '#E8F5E9' : '#FFF8E1',
                    color: grade.value >= 7 ? '#2E7D32' : '#F57F17',
                  }}
                >
                  Nota: {grade.value}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.82rem', color: '#4A554A', marginBottom: 12 }}>
              <div>Evaluación: <strong>{grade?.name || 'Pendiente'}</strong></div>
              {grade?.description && <div>Detalle: {grade.description}</div>}
              {grade?.date && <div>Fecha: {grade.date}</div>}
            </div>

            <button
              onClick={() => onGrade({ enrollment, student })}
              style={{
                width: '100%',
                background: '#1F3A60',
                color: '#FFF',
                padding: '8px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} /> Cargar Nueva Calificación
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   Student Portal View (Course summary & Academic History)
   ========================================================================= */
const StudentPortalView = ({ enrollments, getCourseById, getGrades }) => {
  if (enrollments.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
          border: '1.5px dashed rgba(39,60,44,0.2)',
        }}
      >
        <BookOpen size={40} color="#687768" style={{ marginBottom: 12 }} />
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#273C2C' }}>
          No tenés cursos asignados actualmente
        </h3>
        <p style={{ color: '#687768', fontSize: '0.9rem' }}>
          Ponete en contacto con la administración del instituto para confirmar tu inscripción.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {enrollments.map((enrollment) => {
        const course = getCourseById(enrollment.cursoId);
        const grades = getGrades(enrollment.id);

        return (
          <div key={enrollment.id} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Course Summary Hero Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '24px 28px',
                border: '1px solid rgba(39,60,44,0.14)',
                boxShadow: '0 4px 18px rgba(39,60,44,0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: '#E5EFE5',
                    color: '#273C2C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GraduationCap size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#2E7D32', letterSpacing: '0.5px' }}>
                    CURSO EN CURSO
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#273C2C', margin: '2px 0 0' }}>
                    {course?.name || 'Curso Asignado'} ({course?.level || 'Nivel General'})
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#4A554A', marginTop: 4 }}>
                    Días y horarios: <strong>{course?.schedule || 'A coordinar'}</strong>
                  </div>
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#E8F5E9',
                    color: '#1B5E20',
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  <CheckCircle2 size={16} /> Estado: Regular
                </span>
              </div>
            </div>

            {/* Grades Table */}
            <div
              className="desktop-table-view"
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                border: '1px solid rgba(39,60,44,0.12)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF6EE', borderBottom: '1.5px solid rgba(39,60,44,0.1)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>EVALUACIÓN</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>DETALLES</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C' }}>FECHA</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', fontWeight: 800, color: '#273C2C', textAlign: 'center' }}>CALIFICACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px 18px', textAlign: 'center', color: '#687768', fontSize: '0.9rem' }}>
                        Aún no se han cargado calificaciones para este curso.
                      </td>
                    </tr>
                  ) : (
                    grades.map((g, idx) => (
                      <tr
                        key={g.id || idx}
                        style={{
                          background: idx % 2 === 0 ? '#FFFFFF' : '#FCFAF6',
                          borderBottom: '1px solid rgba(39,60,44,0.06)',
                        }}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#273C2C' }}>{g.name}</td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: '#4A554A' }}>{g.description || '-'}</td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: '#4A554A' }}>{g.date || '-'}</td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: 14,
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              background: g.value >= 7 ? '#E8F5E9' : g.value >= 4 ? '#FFF8E1' : '#FFEBEE',
                              color: g.value >= 7 ? '#2E7D32' : g.value >= 4 ? '#F57F17' : '#D32F2F',
                            }}
                          >
                            {g.value}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Grades */}
            <div className="mobile-cards-view">
              {grades.length === 0 ? (
                <div style={{ background: '#FFF', padding: 20, borderRadius: 14, textAlign: 'center', color: '#687768' }}>
                  Aún no hay calificaciones registradas.
                </div>
              ) : (
                grades.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 14,
                      padding: 16,
                      border: '1px solid rgba(39,60,44,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{g.name}</strong>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 10,
                          fontWeight: 800,
                          background: g.value >= 7 ? '#E8F5E9' : '#FFF8E1',
                          color: g.value >= 7 ? '#2E7D32' : '#F57F17',
                        }}
                      >
                        Nota: {g.value}
                      </span>
                    </div>
                    {g.description && <p style={{ fontSize: '0.82rem', color: '#687768', margin: '6px 0 2px' }}>{g.description}</p>}
                    <span style={{ fontSize: '0.78rem', color: '#8A998A' }}>Fecha: {g.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
