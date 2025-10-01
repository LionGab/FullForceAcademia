import { motion } from 'framer-motion';
import PlanCard from '../common/PlanCard';

/**
 * PlansSection - Seção de planos com destaque e garantia
 */
export const PlansSection = () => {
  const plans = [
    {
      title: 'Plano Mensal',
      price: 'R$ 189',
      period: '/mês',
      description: 'Acesso total e flexibilidade máxima',
      features: [
        'Acesso ilimitado à academia',
        'Todas as modalidades incluídas',
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
        '1 sessão de Personal Trainer/mês',
        'Acesso a eventos exclusivos',
        '30 dias grátis por mês para um amigo',
        'Prioridade no agendamento'
      ],
      whatsappMessage: 'Olá, vim do site e quero o Plano Anual (mais popular)'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <section id="planos" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={titleVariants}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4"
          >
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-full px-6 py-2">
              <span className="text-yellow-400 font-semibold text-sm">PLANOS FLEXÍVEIS</span>
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Escolha seu
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              plano ideal
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Planos pensados para diferentes necessidades e objetivos, todos com nossa 
            <span className="text-yellow-400 font-semibold"> garantia de 7 dias</span> ou seu dinheiro de volta.
          </p>

          {/* Guarantee Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center bg-green-500/10 border border-green-500/20 
                     rounded-full px-6 py-3 text-green-400 font-semibold"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
            Garantia de 7 dias ou seu dinheiro de volta
          </motion.div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => (
            <PlanCard
              key={index}
              {...plan}
            />
          ))}
        </motion.div>

        {/* Bottom Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 
                        border border-gray-700 rounded-2xl p-8 max-w-4xl mx-auto
                        backdrop-blur-sm">
            
            <h3 className="text-2xl font-bold text-white mb-6">
              Todos os planos incluem:
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[
                { title: "Acesso Total", desc: "Todas as modalidades" },
                { title: "Horário Flexível", desc: "05:00 às 22:00" },
                { title: "Estacionamento", desc: "Gratuito e seguro" },
                { title: "Suporte", desc: "Equipe especializada" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  className="text-center"
                >
                  <div className="bg-yellow-500/10 w-16 h-16 rounded-full 
                                flex items-center justify-center mx-auto mb-3">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-8 pt-6 border-t border-gray-700"
            >
              <p className="text-gray-400 text-sm">
                <span className="text-yellow-400">💡 Dica:</span> O plano anual oferece a melhor economia 
                e benefícios exclusivos. Ideal para quem está comprometido com a transformação!
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlansSection;
