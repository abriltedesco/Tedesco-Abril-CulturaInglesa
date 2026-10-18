import React from 'react';
import { GestionAlumnosModal } from '../components/GestionAlumnosModal';

export const AdminPage = ({ showToast, onClose, onLogout }) => (
  <>
    <GestionAlumnosModal isOpen onClose={onClose} showToast={showToast} />
    <button type="button" onClick={onLogout} style={{ position: 'fixed', top: '24px', left: '24px', zIndex: 10000, backgroundColor: '#FFFFFF', color: '#1F3A60', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>CERRAR SESIÓN</button>
  </>
);
