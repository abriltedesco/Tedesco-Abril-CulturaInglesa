import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToast = ({ toast, onClose }) => {
  if (!toast) return null;

  const { type, message } = toast;

  const typeStyles = {
    success: {
      bgColor: '#E8F5E9',
      borderColor: '#2E7D32',
      textColor: '#1B5E20',
      Icon: CheckCircle2,
    },
    error: {
      bgColor: '#FFEBEE',
      borderColor: '#D32F2F',
      textColor: '#B71C1C',
      Icon: AlertCircle,
    },
    info: {
      bgColor: '#E1F5FE',
      borderColor: '#0288D1',
      textColor: '#01579B',
      Icon: Info,
    },
  };

  const style = typeStyles[type] || typeStyles.info;
  const { Icon } = style;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        backgroundColor: style.bgColor,
        borderLeft: `5px solid ${style.borderColor}`,
        color: style.textColor,
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '420px',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Icon size={24} style={{ flexShrink: 0, color: style.borderColor }} />
      <span style={{ fontSize: '0.95rem', fontWeight: 500, flexGrow: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: style.textColor,
          opacity: 0.7,
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};
