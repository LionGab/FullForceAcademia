import PlanCard from './PlanCard';

const PlansSection = () => {
  const plans = [
    {
      title: 'Plano Mensal',
      price: 'R$ 189',
      period: '/mês',
      description: 'Acesso total e flexibilidade máxima',
      features: [
        'Acesso ilimitado à academia',
        'Musculação completa',
        'Flexibilidade total de horários',
        'Suporte da equipe especializada',
        'Uso de todos os equipamentos',
        'Vestiários e estacionamento'
      ],
      whatsappMessage: 'Olá, vim do site e quero o Plano Mensal'
    },
    {
      title: 'Plano Trimestral',
      price: 'R$ 169',
      originalPrice: 'R$ 189',
      period: '/mês',
      description: 'Desconto especial + avaliação física gratuita',
      discount: 11,
      features: [
        'Tudo do plano mensal incluído',
        'Desconto de 11% no valor mensal',
        'Avaliação física completa GRÁTIS',
        'Plano de treino personalizado',
        'Acompanhamento mensal com instrutor',
        'Reavaliação a cada 30 dias'
      ],
      whatsappMessage: 'Olá, vim do site e quero o Plano Trimestral'
    },
    {
      title: 'Plano Anual',
      price: 'R$ 119',
      originalPrice: 'R$ 189',
      period: '/mês',
      description: 'Maior economia + benefícios exclusivos',
      discount: 37,
      isPopular: true,
      features: [
        'Maior economia: 37% de desconto',
        'Avaliação física trimestral',
        'Acompanhamento nutricional GRÁTIS',
        'Treino personalizado',
        'Acesso a eventos exclusivos',
        '30 dias grátis por mês para um amigo',
        'Prioridade no agendamento'
      ],
      whatsappMessage: 'Olá, vim do site e quero o Plano Anual (mais popular)'
    }
  ];

  return (
    <section id="planos" className="plans-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">PLANOS FLEXÍVEIS</div>
          <h2>
            Escolha seu <span className="highlight">plano ideal</span>
          </h2>
          <p className="section-description">
            Planos pensados para diferentes necessidades e objetivos, todos com nossa
            <strong> garantia de 7 dias</strong> ou seu dinheiro de volta.
          </p>
          <div className="guarantee">
            <div className="pulse-dot"></div>
            Garantia de 7 dias ou seu dinheiro de volta
          </div>
        </div>

        <div className="plans-grid">
          {plans.map((plan, index) => (
            <PlanCard key={index} {...plan} />
          ))}
        </div>

        <div className="plans-footer">
          <h3>Todos os planos incluem:</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Acesso Total</h4>
              <p>Todas as modalidades</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Horário Flexível</h4>
              <p>05:00 às 22:00</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Estacionamento</h4>
              <p>Gratuito e seguro</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Suporte</h4>
              <p>Equipe especializada</p>
            </div>
          </div>
          <p className="tip">
            💡 <strong>Dica:</strong> O plano anual oferece a melhor economia
            e benefícios exclusivos. Ideal para quem está comprometido com a transformação!
          </p>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
