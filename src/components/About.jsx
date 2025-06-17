import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <main className="about-page">
      <section className="our-story">
        <div className="container">
          <div className="text-content">
            <h2>Our Story</h2>
          <p>
              Outbye started as a visionary idea to create a platform that helps people discover restaurants, cafes, and hotels tailored to their preferences. We embarked on this journey with a clear goal: to simplify the process of finding the perfect place, whether for a casual meal, a cozy coffee, or a comfortable stay.
            </p>
            <p>
              As a team of dedicated developers, we poured our hearts into researching and building a system that could deliver personalized recommendations and location-based services. The road to development was filled with challenges—from designing an intuitive user experience to ensuring the platform could handle diverse user needs. But every obstacle became an opportunity to learn and grow.
            </p>
            <p>
              Our progress is a testament to the power of research and collaboration. Through countless hours of hard work, we refined Outbye’s features, drawing on insights from extensive studies and feedback. We were fortunate to have the guidance of experienced professors and supervising engineers, whose expertise helped shape the platform into what it is today.
            </p>
            <p>
              Outbye is still in the making, but we’re driven by a shared passion to bring this vision to life. We’re committed to creating a tool that not only serves users but also supports local businesses in reaching their audience. This journey of development has been one of growth and discovery, and we’re excited for what’s to come.
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