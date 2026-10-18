import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading }) => {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid #273C2C',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              backgroundColor: '#FFEBEE',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D32F2F',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 id="confirm-modal-title" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#273C2C' }}>
            {title || '¿Confirmar acción?'}
          </h3>
        </div>

        <p id="confirm-modal-description" style={{ color: '#4A554A', fontSize: '0.95rem', marginBottom: '24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #273C2C',
              backgroundColor: '#FFFFFF',
              color: '#273C2C',
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#D32F2F',
              color: '#FFFFFF',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
