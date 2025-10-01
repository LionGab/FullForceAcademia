const BenefitsSection = () => {
  const benefits = [
    {
      icon: '🏢',
      title: 'Estrutura Completa',
      description: 'Mais de 500m² de área climatizada com equipamentos de última geração',
      color: '#f59e0b'
    },
    {
      icon: '👨‍🏫',
      title: 'Profissionais Qualificados',
      description: 'Equipe de instrutores e personal trainers com certificação nacional',
      color: '#3b82f6'
    },
    {
      icon: '🔒',
      title: 'Ambiente Seguro',
      description: 'Câmeras de segurança, acesso controlado e protocolos de higiene',
      color: '#22c55e'
    },
    {
      icon: '💯',
      title: 'Garantia de Satisfação',
      description: '7 dias de garantia ou seu dinheiro de volta, sem burocracia',
      color: '#8b5cf6'
    },
    {
      icon: '📱',
      title: 'App Exclusivo',
      description: 'Controle seus treinos, evolução e agende aulas pelo celular',
      color: '#ec4899'
    },
    {
      icon: '🎁',
      title: 'Benefícios Extras',
      description: 'Parcerias com nutricionistas, fisioterapeutas e lojas esportivas',
      color: '#f97316'
    }
  ];

  return (
    <section className="benefits-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">DIFERENCIAIS</div>
          <h2>
            Por que escolher a <span className="highlight">Full Force</span>?
          </h2>
          <p className="section-description">
            Vantagens exclusivas que fazem a diferença na sua jornada fitness
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="benefit-card"
              style={{ '--benefit-color': benefit.color }}
            >
              <div className="benefit-icon-large">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
              <div className="benefit-decoration"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
