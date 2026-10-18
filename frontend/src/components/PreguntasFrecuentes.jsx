import React, { useState } from 'react';
import { AccordionItem } from './AccordionItem';

export const PreguntasFrecuentes = () => {
  // By default in figma mockup, items 1 and 2 are open, item 3 is collapsed.
  const [openItems, setOpenItems] = useState({ 1: true, 2: true, 3: false });

  const faqData = [
    {
      id: 1,
      question: '¿Para que edades y que niveles están dirigidas las clases?',
      answer: 'Los niveles son por edad y dirigimos las clases desde niños apartir de los 4 años hasta adultos.',
    },
    {
      id: 2,
      question: '¿Es obligatorio rendir el First Certificate (FCE) para tomar las clases?',
      answer: 'Para nada. No obligamos a ningun alumno a realizar el FCE ni ningún otro tipo de exámen pero sí recomendamos rendirlo y apuntamos fuertemente a que lo hagas, ya que consideramos que los exámenes internacionales tienen un gran peso para el futuro profesional y personal de cada alumno.',
    },
    {
      id: 3,
      question: '¿Cuál es su horario?',
      answer: 'Nuestro horario de atención e impartición de clases es de Lunes a Jueves de 17:00 a 20:30 hs.',
    },
  ];

  const handleToggle = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section
      id="preguntas-frecuentes"
      aria-labelledby="faq-title"
      style={{ padding: '80px 0', backgroundColor: '#FEF7ED' }}
    >
      <div className="container" style={{ maxWidth: '900px' }}>
        <h2
          id="faq-title"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#273C2C',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          PREGUNTAS FRECUENTES
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {faqData.map((faq) => (
            <AccordionItem
              key={faq.id}
              id={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={!!openItems[faq.id]}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
