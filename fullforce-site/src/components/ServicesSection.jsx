const ServicesSection = () => {
  const services = [
    {
      icon: '🏋️',
      title: 'Musculação',
      description: 'Equipamentos de última geração para treinos completos e eficazes',
      features: ['Pesos livres', 'Máquinas profissionais', 'Área completa', 'Treinos personalizados']
    }
  ];

  return (
    <section id="servicos" className="services-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">NOSSA ESPECIALIDADE</div>
          <h2>
            <span className="highlight">Musculação Completa</span> para seus objetivos
          </h2>
          <p className="section-description">
            Equipamentos de ponta e profissionais qualificados para te ajudar a alcançar seus resultados
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
