import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Calendar, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ServiceCard - Card de serviço otimizado com schedules e tracking
 */
export const ServiceCard = ({
  id,
  icon,
  title,
  description,
  features,
  image,
  schedules,
  whatsappMessage
}) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const createWhatsAppLink = (message) => {
    const whatsappNumber = "5566999570328";
    const fullMessage = `${message} | Origem: ${title.toLowerCase().replace(' ', '_')}_card`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;
  };

  const handleReserveClick = () => {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'click_reserve_schedule', {
        event_category: 'CTA',
        event_label: title.toLowerCase().replace(' ', '_'),
        value: 1
      });
    }
    
    window.open(createWhatsAppLink(whatsappMessage), '_blank');
  };

  const toggleSchedule = () => {
    setIsScheduleOpen(!isScheduleOpen);
    
    if (typeof gtag !== 'undefined') {
      gtag('event', 'toggle_schedule', {
        event_category: 'Interaction',
        event_label: title,
        event_action: isScheduleOpen ? 'close' : 'open'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -5 }}
      className="group h-full"
    >
      <Card className="bg-gradient-to-b from-gray-900 to-gray-800 border-yellow-500/20 
                     hover:border-yellow-500/50 transition-all duration-500 h-full overflow-hidden
                     shadow-lg hover:shadow-2xl">
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={`${title} na Full Force Academia Matupá`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Icon overlay */}
          <div className="absolute bottom-4 left-4 bg-yellow-500/20 backdrop-blur-sm 
                        p-3 rounded-full border border-yellow-500/30">
            {icon}
          </div>
        </div>

        {/* Content Section */}
        <CardHeader>
          <CardTitle className="text-yellow-400 text-xl font-bold">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <p className="text-gray-300 leading-relaxed">
            {description}
          </p>
          
          {/* Features List */}
          <div className="space-y-2 flex-1">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center text-sm text-gray-400"
              >
                <CheckCircle className="w-4 h-4 text-yellow-400 mr-3 flex-shrink-0" />
                {feature}
              </motion.div>
            ))}
          </div>

          {/* Schedule Section */}
          {schedules && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 mb-3
                         transition-all duration-300"
                onClick={toggleSchedule}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver horários
                {isScheduleOpen ? 
                  <ChevronUp className="w-4 h-4 ml-2" /> : 
                  <ChevronDown className="w-4 h-4 ml-2" />
                }
              </Button>

              <AnimatePresence>
                {isScheduleOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-800/50 rounded-lg p-3 mb-3 border border-yellow-500/20"
                  >
                    <div className="space-y-2 text-sm">
                      {Object.entries(schedules).map(([period, time]) => (
                        <div key={period} className="flex justify-between items-center">
                          <span className="text-gray-400 capitalize font-medium">{period}:</span>
                          <span className="text-white">{time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 
                       hover:from-yellow-600 hover:to-yellow-700 text-black font-bold 
                       transition-all duration-300 shadow-lg hover:shadow-xl
                       py-3 text-base"
              onClick={handleReserveClick}
              aria-label={`Reservar horário para ${title} no WhatsApp`}
            >
              Reservar no WhatsApp
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ServiceCard;
