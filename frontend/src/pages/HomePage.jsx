import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Cursos } from '../components/Cursos';
import { DividerBanner } from '../components/DividerBanner';
import { SobreNosotros } from '../components/SobreNosotros';
import { PreguntasFrecuentes } from '../components/PreguntasFrecuentes';
import { Contacto } from '../components/Contacto';
import { Footer } from '../components/Footer';
import { NotificationToast } from '../components/NotificationToast';

export const HomePage = ({ onOpenLogin }) => {
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenLogin={onOpenLogin} />

      <main style={{ flexGrow: 1 }}>
        <Hero />
        <Cursos />
        <DividerBanner text="Tu futuro profesional también se habla en inglés" />
        <SobreNosotros />        
        <DividerBanner text="El futuro no se espera, se prepara" />        
        <PreguntasFrecuentes />        
        <DividerBanner text="Dominar el inglés ya no es un simple “extra” en el currículum, sino una herramienta indispensable para abrir puertas y crear verdaderas oportunidades, tanto a nivel personal como profesional." />
        <Contacto showToast={showToast} />
      </main>

      <Footer />
      
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
