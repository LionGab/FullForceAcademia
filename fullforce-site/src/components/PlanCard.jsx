const PlanCard = ({
  title,
  price,
  originalPrice,
  period,
  description,
  discount,
  features,
  isPopular,
  whatsappMessage
}) => {
  const whatsappNumber = "5566999570328";

  const handleClick = () => {
    const fullMessage = `${whatsappMessage} | Origem: plan_card`;
    const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;
    window.open(link, '_blank');
  };

  return (
    <div className={`plan-card ${isPopular ? 'popular' : ''}`}>
      {isPopular && <div className="plan-badge">MAIS POPULAR</div>}
      {discount && <div className="plan-discount">-{discount}% OFF</div>}

      <div className="plan-header">
        <h3>{title}</h3>
        <div className="plan-price">
          {originalPrice && <span className="original-price">{originalPrice}</span>}
          <div className="current-price">
            <span className="price">{price}</span>
            <span className="period">{period}</span>
          </div>
        </div>
        <p className="plan-description">{description}</p>
      </div>

      <ul className="plan-features">
        {features.map((feature, index) => (
          <li key={index}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="#f59e0b"/>
              <path d="M6 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <button onClick={handleClick} className="plan-button">
        Assinar Agora
      </button>
    </div>
  );
};

export default PlanCard;
