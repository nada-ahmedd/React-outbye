import React, { useState, useEffect } from 'react';
import '../styles/Banner.css'; // We’ll create this CSS file next

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { src: '/images/pexels-photo-260922.webp', alt: 'Slide 1' },
    { src: '/images/lanscape-empty-restaurant.jpg', alt: 'Slide 2' },
    { src: '/images/pexels-photo-338504.jpeg', alt: 'Slide 3' },
  ];

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, [slides.length]);

  // Handle dot click
  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="banner">
      <div className="carousel">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
          >
            <img src={slide.src} alt={slide.alt} />
            <div className="carousel-overlay"></div>
          </div>
        ))}
      </div>
      <div className="dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          ></span>
        ))}
      </div>
      <div className="banner-text">
        Welcome to <span>OutBye</span>
      </div>
    </section>
  );
};

export default Banner;