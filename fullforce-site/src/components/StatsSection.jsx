import { useState, useEffect, useRef } from 'react';

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const stats = [
    { value: 650, suffix: '+', label: 'Alunos Ativos', icon: '👥' },
    { value: 8, suffix: ' anos', label: 'De Experiência', icon: '🏆' },
    { value: 300, suffix: 'm²', label: 'de Estrutura', icon: '🏋️' },
    { value: 98, suffix: '%', label: 'Satisfação', icon: '⭐' }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const AnimatedNumber = ({ value, suffix }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (isVisible) {
        let start = 0;
        const end = value;
        const duration = 2000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);

        return () => clearInterval(timer);
      }
    }, [isVisible, value]);

    return (
      <span className="stat-number">
        {count}
        <span className="stat-suffix">{suffix}</span>
      </span>
    );
  };

  return (
    <section className="stats-section" ref={sectionRef}>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`stat-card ${isVisible ? 'visible' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
