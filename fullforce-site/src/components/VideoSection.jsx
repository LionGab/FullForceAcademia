import { useRef } from 'react';

const VideoSection = () => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  const handlePlayClick = () => {
    if (videoRef.current && overlayRef.current) {
      videoRef.current.play();
      overlayRef.current.style.opacity = '0';
      setTimeout(() => {
        overlayRef.current.style.display = 'none';
      }, 300);
    }
  };

  return (
    <section className="video-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">NOSSA HISTÓRIA</div>
          <h2>
            <span className="highlight">Inauguração</span> Full Force Academia
          </h2>
          <p className="section-description">
            Veja como foi o início da nossa jornada em Matupá-MT
          </p>
        </div>
        <div className="video-container">
          <video
            ref={videoRef}
            controls
            className="inauguration-video"
            poster="/vite.svg"
            preload="metadata"
          >
            <source src="/inauguracao.mp4" type="video/mp4" />
            Seu navegador não suporta o elemento de vídeo.
          </video>
          <div ref={overlayRef} className="video-play-overlay" onClick={handlePlayClick}>
            <div className="video-play-button">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M10 8L24 16L10 24V8Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
