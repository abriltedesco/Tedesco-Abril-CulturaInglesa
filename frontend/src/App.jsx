import React, { useEffect, useState } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { authService } from './services/authService';
import './styles/global.css';

export function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const goTo = (nextRoute) => { window.location.hash = nextRoute; };
  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 4500); };
  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* The local session is still cleared. */ }
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    goTo('');
  };

  if (route === '#login') return <LoginPage onLogin={() => goTo('gestor-alumnos')} onBack={() => goTo('')} />;
  if (route === '#gestor-alumnos') {
    const user = JSON.parse(sessionStorage.getItem('authUser') || 'null');
    if (!user || user.rol !== 'ADMIN' || !sessionStorage.getItem('authToken')) {
      return <LoginPage onLogin={() => goTo('gestor-alumnos')} onBack={() => goTo('')} />;
    }
    return <AdminPage showToast={showToast} onClose={() => goTo('')} onLogout={handleLogout} />;
  }
  return <HomePage onOpenLogin={() => goTo('login')} />;
}

export default App;
