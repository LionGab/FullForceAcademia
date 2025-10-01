const Logo = ({ className = "", width = 180, showText = true }) => {
  return (
    <div className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      {/* Logo Symbol */}
      <svg
        width={showText ? "40" : width}
        height={showText ? "40" : width}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <g transform="translate(50, 50) rotate(45)">
          <path d="M-35,-35 L-35,5 L-15,5 L-15,15 L5,15 L5,35 L35,35 L35,-35 Z" fill="#FFFFFF"/>
          <path d="M-35,-35 L-35,5 L-15,5 L-15,-15 L5,-15 L5,-35 Z" fill="#FDB913"/>
          <path d="M5,15 L5,35 L35,35 L35,15 L15,15 L15,-15 L-15,-15 L-15,5 L5,5 Z" fill="#000000"/>
        </g>
      </svg>

      {/* Logo Text */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #FDB913 0%, #FDB913 50%, #000 50%, #000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            FullForce
          </span>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#FDB913',
            letterSpacing: '0.1em',
            marginTop: '-2px'
          }}>
            Academia
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
