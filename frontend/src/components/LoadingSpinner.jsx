import React from 'react';

export const LoadingSpinner = ({ size = 32, label = "Cargando..." }) => {
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '4px solid rgba(31, 58, 96, 0.2)',
          borderTop: '4px solid #1F3A60',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.9rem', color: '#4A554A', fontWeight: 500 }}>{label}</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
