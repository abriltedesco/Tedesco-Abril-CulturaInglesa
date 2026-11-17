import React from 'react';

export const CursoCard = ({ title, image, description, levels = [], schedules, index }) => (
  <article className="curso-card">
    <span className="curso-num">{String(index + 1).padStart(2, '0')}</span>
    <div
      style={{
        width: '100%',
        height: '220px',
        borderRadius: '18px',
        overflow: 'hidden',
        marginBottom: '22px',
      }}
    >
      <img
        className="curso-img"
        src={image}
        alt={`Clases para ${title}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>

    <h3
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#273C2C',
        letterSpacing: '1px',
        marginBottom: '12px',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </h3>

    <p style={{ fontSize: '0.93rem', color: '#4A554A', lineHeight: 1.6, marginBottom: '16px', padding: '0 8px' }}>
      {description}
    </p>

    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginBottom: '24px', flexGrow: 1, alignContent: 'flex-start' }}>
      {levels.map((level) => (
        <span
          key={level}
          style={{ background: '#273C2C', color: '#FEF7ED', borderRadius: '999px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600 }}
        >
          {level}
        </span>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minHeight: '82px', justifyContent: 'flex-end' }}>
      {schedules.map((schedule) => (
        <span
          key={schedule}
          style={{
            border: '1.5px solid #273C2C',
            borderRadius: '999px',
            padding: '7px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#273C2C',
            background: '#FEF7ED',
            whiteSpace: 'nowrap',
          }}
        >
          {schedule}
        </span>
      ))}
    </div>
  </article>
);
