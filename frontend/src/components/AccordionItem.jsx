import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const AccordionItem = ({ id, question, answer, isOpen, onToggle }) => {
  const buttonId = `accordion-header-${id}`;
  const contentId = `accordion-panel-${id}`;

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1.5px solid #273C2C',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <button
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        style={{
          width: '100%',
          backgroundColor: '#1F3A60',
          color: '#FFFFFF',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          fontSize: '1rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          gap: '16px',
        }}
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp size={22} style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={22} style={{ flexShrink: 0 }} />
        )}
      </button>

      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={buttonId}
          style={{
            backgroundColor: '#FEF7ED',
            padding: '20px 24px',
            color: '#273C2C',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            borderTop: '1px solid rgba(39, 60, 44, 0.15)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {answer}
        </div>
      )}
    </div>
  );
};
