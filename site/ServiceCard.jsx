// components/common/ServiceCard.jsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * ServiceCard Component
 * @param {Object} props - Component props
 * @param {string} props.id - Service identifier
 * @param {React.Element} props.icon - Service icon component
 * @param {string} props.title - Service title
 * @param {string} props.description - Service description
 * @param {Array} props.features - List of service features
 * @param {string} props.image - Service image URL
 * @param {Object} props.schedules - Service schedules
 * @param {Object} props.variants - Animation variants
 */
export const ServiceCard = ({
  id,
  icon,
  title,
  description,
  features,
  image,
  schedules,
  variants
}) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const { createWhatsAppLink } = useWhatsApp();
  const { trackEvent } = useAnalytics();

  const handleReserveClick = () => {
    trackEvent('click_reserve_schedule', {
      category: 'CTA',
      label: title.toLowerCase().replace(' ', '_')
    });
    
    const message = `Olá, vim do site e quero reservar horário para ${title}`;
    window.open(createWhatsAppLink(message, title), '_blank');
  };

  const toggleSchedule = () => {
    setIsScheduleOpen(!isScheduleOpen);
    trackEvent('toggle_schedule', {
      category: 'Interaction',
      label: title,
      action: isScheduleOpen ? 'close' : 'open'
    });
  };

  return (
    <motion.div
      variants={variants}
      className="group h-full"
      whileHover={{ y: -5 }}
    >
      <Card className="bg-gradient-to-b from-gray-900 to-gray-800 border-yellow-500/20 
                     hover:border-yellow-500/50 transition-all duration-500 h-full overflow-hidden">
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={`${title} na Full Force Academia Matupá`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4">
            {icon}
          </div>
        </div>

        {/* Content Section */}
        <CardHeader>
          <CardTitle className="text-yellow-400 text-xl">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-gray-300 leading-relaxed">
            {description}
          </CardDescription>
          
          {/* Features List */}
          <FeaturesList features={features} />

          {/* Schedule Section */}
          <ScheduleSection 
            schedules={schedules}
            isOpen={isScheduleOpen}
            onToggle={toggleSchedule}
          />

          {/* CTA Button */}
          <Button 
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 
                     hover:from-yellow-600 hover:to-yellow-700 text-black font-bold 
                     transition-all duration-300"
            onClick={handleReserveClick}
            aria-label={`Reservar horário para ${title} no WhatsApp`}
          >
            Reservar no WhatsApp
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * FeaturesList Sub-component
 */
const FeaturesList = ({ features }) => (
  <div className="space-y-2">
    {features.map((feature, index) => (
      <div key={index} className="flex items-center text-sm text-gray-400">
        <CheckCircle className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
        {feature}
      </div>
    ))}
  </div>
);

/**
 * ScheduleSection Sub-component
 */
const ScheduleSection = ({ schedules, isOpen, onToggle }) => (
  <div className="mt-4">
    <Button
      variant="outline"
      size="sm"
      className="w-full border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 mb-3"
      onClick={onToggle}
    >
      <Calendar className="w-4 h-4 mr-2" />
      Ver horários
      {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
    </Button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-800/50 rounded-lg p-3 mb-3"
        >
          <ScheduleList schedules={schedules} />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/**
 * ScheduleList Sub-component
 */
const ScheduleList = ({ schedules }) => (
  <div className="space-y-2 text-sm">
    {Object.entries(schedules).map(([period, time]) => (
      <div key={period} className="flex justify-between">
        <span className="text-gray-400 capitalize">{period}:</span>
        <span className="text-white">{time}</span>
      </div>
    ))}
  </div>
);

export default ServiceCard;