import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <main className="about-page"> {/* إضافة كلاس للتحكم في الإستايلات */}
      <section className="our-story">
        <div className="container">
          <div className="text-content">
            <h2>Our Story</h2>
            <p>
              Launched in 2025, Outbye is a platform designed to provide tailored recommendations for restaurants,
              cafes, and hotels based on customer preferences. Our mission is to make it easier for people to
              discover the best places that meet their needs.
            </p>
          </div>
          <div className="image-content">
            <img src="images/out bye.png" alt="Our Story" />
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stat-item">
          <i className="fas fa-store"></i>
          <p>50+</p>
          <span>Partners offering services</span>
        </div>
        <div className="stat-item highlight">
          <i className="fas fa-dollar-sign"></i>
          <p>10k+</p>
          <span>Monthly Recommendations</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-users"></i>
          <p>30k+</p>
          <span>Active Users</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-chart-line"></i>
          <p>1M+</p>
          <span>Annual Revenue</span>
        </div>
      </section>

      <section className="team">
        <div className="container">
          <h2>Our Team</h2>
          <div className="team-member">
            <img src="images/WhatsApp Image 2024-09-08 at 23.35.44_f82e829f.jpg" alt="Nada Ahmed" />
            <h3>Nada Ahmed</h3>
            <p>Front-end Web Developer</p>
            <div className="social-icons">
              <i className="fab fa-twitter"></i>
              <i className="fab fa-instagram"></i>
              <i className="fab fa-linkedin"></i>
            </div>
          </div>
          <div className="team-member">
            <img src="images/abdelrahman.jpg" alt="Abdelrahman Ahmed" />
            <h3>Abdelrahman Ahmed</h3>
            <p>Back-end Developer</p>
            <div className="social-icons">
              <i className="fab fa-twitter"></i>
              <i className="fab fa-instagram"></i>
              <i className="fab fa-linkedin"></i>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Our Features</h2>
          <div className="feature-item">
            <i className="fas fa-search"></i>
            <h4>Personalized Recommendations</h4>
            <p>Find the best places based on your preferences.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-map-marker-alt"></i>
            <h4>Location-Based Services</h4>
            <p>Discover places near you with easy filters.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-comments"></i>
            <h4>User Reviews</h4>
            <p>Read real feedback to make informed choices.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;