import './App.css'

function App() {
  const whatsappNumber = "5566999570328";

  const createWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="App">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">⚡ Academia #1 de Matupá-MT</div>
          <h1>Sua melhor versão começa aqui</h1>
          <p className="subtitle">
            Estrutura completa, equipe atenciosa e programas feitos para sua realidade.
            Comece com uma aula gratuita.
          </p>
          <a
            href={createWhatsAppLink("Olá, vim do site e quero agendar uma aula teste gratuita!")}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Agendar Aula Grátis no WhatsApp →
          </a>

          <div className="stats">
            <div className="stat">
              <div className="stat-number">1.300+</div>
              <div className="stat-label">Alunos atendidos</div>
            </div>
            <div className="stat">
              <div className="stat-number">#1</div>
              <div className="stat-label">Academia de Matupá</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Suporte atencioso</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section services">
        <div className="container">
          <h2 className="section-title">Modalidades disponíveis</h2>
          <p className="section-subtitle">Encontre a atividade perfeita para seus objetivos</p>

          <div className="services-grid">
            {[
              {
                icon: "💪",
                title: "Musculação",
                description: "Equipamentos modernos e orientação profissional para você evoluir com segurança.",
                features: ["Equipamentos novos", "Orientação profissional", "Avaliação física"]
              },
              {
                icon: "👥",
                title: "Aulas Coletivas",
                description: "Instrutores certificados e energia contagiante para treinos em grupo.",
                features: ["Instrutores certificados", "Horários flexíveis", "Ambiente motivador"]
              },
              {
                icon: "🎯",
                title: "Emagrecimento",
                description: "Plano personalizado com acompanhamento para resultados duradouros.",
                features: ["Plano personalizado", "Acompanhamento", "Resultados garantidos"]
              }
            ].map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
                <a
                  href={createWhatsAppLink(`Olá, quero saber mais sobre ${service.title}`)}
                  className="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reservar horário
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="section plans">
        <div className="container">
          <h2 className="section-title">Escolha seu plano ideal</h2>
          <p className="section-subtitle">Planos flexíveis com garantia de 7 dias</p>

          <div className="plans-grid">
            {[
              {
                title: "Plano Mensal",
                price: "R$ 189",
                period: "/mês",
                description: "Acesso total e flexibilidade",
                features: [
                  "Acesso ilimitado",
                  "Todas as modalidades",
                  "Flexibilidade total",
                  "Suporte da equipe"
                ],
                whatsappMessage: "Olá, vim do site e quero o Plano Mensal"
              },
              {
                title: "Plano Trimestral",
                price: "R$ 169",
                period: "/mês",
                description: "Desconto especial + avaliação física",
                features: [
                  "Tudo do plano mensal",
                  "Desconto de 11%",
                  "Avaliação física GRÁTIS",
                  "Plano personalizado"
                ],
                whatsappMessage: "Olá, vim do site e quero o Plano Trimestral",
                popular: false
              },
              {
                title: "Plano Anual",
                price: "R$ 119",
                period: "/mês",
                description: "Maior economia + benefícios exclusivos",
                features: [
                  "Economia de 37%",
                  "Avaliação trimestral",
                  "Nutricional GRÁTIS",
                  "Personal Trainer/mês"
                ],
                whatsappMessage: "Olá, vim do site e quero o Plano Anual (mais popular)",
                popular: true
              }
            ].map((plan, index) => (
              <div key={index} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">MAIS POPULAR</div>}
                <h3 className="plan-title">{plan.title}</h3>
                <div className="plan-price">
                  {plan.price}
                  <span className="plan-period">{plan.period}</span>
                </div>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <a
                  href={createWhatsAppLink(plan.whatsappMessage)}
                  className="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Escolher plano
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section contact">
        <div className="container">
          <h2 className="section-title">Entre em contato</h2>
          <p className="section-subtitle">Estamos prontos para te atender</p>

          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon">📱</div>
              <h3 className="contact-title">WhatsApp</h3>
              <p className="contact-info">(66) 99957-0328</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <h3 className="contact-title">Localização</h3>
              <p className="contact-info">Rua 09, 203 - Matupá-MT</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">⏰</div>
              <h3 className="contact-title">Horário</h3>
              <p className="contact-info">Seg-Sex: 05:00 - 22:00<br />Sáb: 08:00 - 12:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <h3 className="footer-title">Full Force Academia</h3>
          <p className="footer-slogan">Sua transformação começa aqui</p>
          <p className="footer-copy">© 2024 Full Force Academia Matupá-MT. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <a
        href={createWhatsAppLink("Olá, vim do site e quero agendar uma aula teste!")}
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}

export default App;
