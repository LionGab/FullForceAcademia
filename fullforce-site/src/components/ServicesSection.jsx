const ServicesSection = () => {
  const services = [
    {
      icon: '🏋️',
      title: 'Musculação',
      description: 'Equipamentos Technogym de última geração para treinos completos',
      features: ['Pesos livres', 'Máquinas profissionais', 'Área de funcional']
    },
    {
      icon: '🚴',
      title: 'Spinning',
      description: 'Aulas de bike indoor com instrutores qualificados e playlists motivacionais',
      features: ['Bikes ergonômicas', 'Aulas dinâmicas', 'Turmas variadas']
    },
    {
      icon: '🧘',
      title: 'Aulas Coletivas',
      description: 'Diversas modalidades para todos os níveis e objetivos',
      features: ['Yoga', 'Pilates', 'Zumba', 'Aeróbica']
    },
    {
      icon: '💪',
      title: 'Personal Trainer',
      description: 'Acompanhamento individualizado com profissionais especializados',
      features: ['Treino personalizado', 'Avaliação física', 'Nutrição']
    },
    {
      icon: '🥊',
      title: 'Funcional',
      description: 'Treinos funcionais para melhorar força, equilíbrio e resistência',
      features: ['Circuitos', 'TRX', 'Kettlebell']
    },
    {
      icon: '🏃',
      title: 'CrossFit',
      description: 'Treinos de alta intensidade para resultados rápidos',
      features: ['WODs diários', 'Box equipado', 'Coaches certificados']
    }
  ];

  return (
    <section id="servicos" className="services-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">NOSSAS MODALIDADES</div>
          <h2>
            Mais de <span className="highlight">15 modalidades</span> para você
          </h2>
          <p className="section-description">
            Equipamentos de ponta e profissionais qualificados para te ajudar a alcançar seus objetivos
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon-wrapper">
                <span className="service-icon">{service.icon}</span>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <ul className="service-features">
                {service.features.map((feature, idx) => (
                  <li key={idx}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
