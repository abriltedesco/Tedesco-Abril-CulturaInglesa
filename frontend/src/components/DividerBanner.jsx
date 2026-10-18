import React from 'react';

export const DividerBanner = ({ text }) => {
  return (
    <div
      role="region"
      aria-label="Frase destacada"
      style={{
        borderTop: '1.5px solid #273C2C',
        borderBottom: '1.5px solid #273C2C',
        padding: '24px 20px',
        backgroundColor: '#FEF7ED',
        textAlign: 'center',
      }}
    >
      <div className="container">
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            fontWeight: 500,
            color: '#273C2C',
            lineHeight: 1.5,
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};
