import { useState } from 'react';

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Aluna há 2 anos',
      image: '👩',
      rating: 5,
      text: 'Melhor academia de Matupá! Ambiente acolhedor, equipamentos modernos e instrutores sempre dispostos a ajudar. Perdi 15kg e ganhei muita qualidade de vida!'
    },
    {
      name: 'João Santos',
      role: 'Aluno há 1 ano',
      image: '👨',
      rating: 5,
      text: 'Excelente estrutura e professores qualificados. A musculação aqui me ajudou a conquistar resultados que eu não imaginava possível. Recomendo muito!'
    },
    {
      name: 'Ana Paula',
      role: 'Aluna há 3 anos',
      image: '👩‍🦰',
      rating: 5,
      text: 'A Full Force mudou minha vida! Além de treinar, fiz amigos incríveis. O ambiente é motivador e os equipamentos são de primeira. Não troco por nada!'
    },
    {
      name: 'Carlos Mendes',
      role: 'Aluno há 6 meses',
      image: '🧔',
      rating: 5,
      text: 'Academia top! Equipamentos de primeira, ambiente limpo e organizado. Os treinos são sensacionais e os resultados aparecem rápido. Melhor investimento que já fiz!'
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="depoimentos" className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">DEPOIMENTOS</div>
          <h2>
            O que nossos <span className="highlight">alunos dizem</span>
          </h2>
          <p className="section-description">
            Histórias reais de transformação e superação
          </p>
        </div>

        <div className="testimonials-carousel">
          <button className="carousel-btn prev" onClick={prevTestimonial} aria-label="Anterior">
            &#8249;
          </button>

          <div className="testimonials-wrapper">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`testimonial-card ${index === currentIndex ? 'active' : ''}`}
                style={{
                  transform: `translateX(${(index - currentIndex) * 110}%)`,
                  opacity: index === currentIndex ? 1 : 0.3
                }}
              >
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{testimonial.image}</div>
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
              </div>
            ))}
          </div>

          <button className="carousel-btn next" onClick={nextTestimonial} aria-label="Próximo">
            &#8250;
          </button>
        </div>

        <div className="testimonials-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir para depoimento ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
