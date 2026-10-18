import React from 'react';

export const CursoCard = ({ title, image, description, schedules, onSelectCurso }) => {
  return (
    <article
      style={{
        backgroundColor: '#FEF7ED',
        border: '1.5px solid #273C2C',
        borderRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        boxShadow: '0 4px 14px rgba(39, 60, 44, 0.05)',
      }}
    >
      {/* Course Image */}
      <div
        style={{
          width: '100%',
          height: '210px',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '1px solid rgba(39, 60, 44, 0.2)',
        }}
      >
        <img
          src={image}
          alt={`Clases para ${title}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Course Title */}
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: '#273C2C',
          letterSpacing: '0.5px',
          marginBottom: '12px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '0.9rem',
          color: '#273C2C',
          lineHeight: '1.5',
          marginBottom: '24px',
          flexGrow: 1,
        }}
      >
        {description}
      </p>

      {/* Schedules list as rounded pills */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
        }}
      >
        {schedules.map((schedule, index) => (
          <span
            key={index}
            style={{
              display: 'block',
              border: '1.5px solid #273C2C',
              borderRadius: '25px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#273C2C',
              backgroundColor: '#FEF7ED',
            }}
          >
            {schedule}
          </span>
        ))}
      </div>
    </article>
  );
};
