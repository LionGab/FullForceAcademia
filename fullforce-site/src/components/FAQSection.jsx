import { useState } from 'react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Como funciona a aula teste grátis?',
      answer: 'Entre em contato pelo WhatsApp e agende seu horário. Você terá acesso completo à academia por 1 dia para conhecer nossa estrutura, equipamentos e experimentar as aulas.'
    },
    {
      question: 'Preciso de atestado médico?',
      answer: 'Sim, recomendamos que todos os alunos apresentem atestado médico atualizado. Para alunos acima de 70 anos ou com condições especiais, o atestado é obrigatório.'
    },
    {
      question: 'Posso cancelar minha matrícula?',
      answer: 'Sim! Oferecemos garantia de 7 dias. Se não ficar satisfeito, devolvemos 100% do valor pago. Após esse período, o cancelamento segue as regras do contrato.'
    },
    {
      question: 'Vocês oferecem treino personalizado?',
      answer: 'Sim! Todos os alunos recebem uma avaliação física e plano de treino personalizado. Nossa equipe de instrutores acompanha sua evolução regularmente.'
    },
    {
      question: 'Qual o horário de funcionamento?',
      answer: 'Segunda a sexta: 05:00 às 22:00. Sábados: 08:00 às 12:00. Domingos e feriados: fechado.'
    },
    {
      question: 'A academia tem estacionamento?',
      answer: 'Sim! Temos estacionamento gratuito e coberto para todos os alunos, com segurança e monitoramento.'
    },
    {
      question: 'Posso levar um acompanhante?',
      answer: 'No plano anual, você ganha 30 dias grátis por mês para um amigo treinar com você! Nos demais planos, consulte condições especiais.'
    },
    {
      question: 'Como funciona o acompanhamento nutricional?',
      answer: 'No plano anual, você tem direito a acompanhamento nutricional gratuito com nossa nutricionista parceira, incluindo plano alimentar personalizado.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">FAQ</div>
          <h2>
            Perguntas <span className="highlight">Frequentes</span>
          </h2>
          <p className="section-description">
            Tire suas dúvidas sobre a Full Force Academia
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button className="faq-question" onClick={() => toggleFAQ(index)}>
                <span>{faq.question}</span>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-cta">
          <p>Não encontrou sua resposta?</p>
          <a
            href="https://wa.me/5566991080808?text=Olá,%20tenho%20uma%20dúvida!"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Fale Conosco no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
