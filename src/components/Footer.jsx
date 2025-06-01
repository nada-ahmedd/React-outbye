import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import FeedbackPopup from './FeedbackPopup';
import '../styles/Footer.css';

const Footer = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const { userId, isLoggedIn } = useSelector((state) => state.auth);

  return (
    <footer className="site-footer bg-dark text-white py-5">
      <div className="container">
        <div className="row">
          {/* Rate Our Service column moved to the first position */}
          {isLoggedIn && userId && (
            <div className="col-lg-2 col-md-6 mb-4 rate-service-col">
              <button
                className="rate-service-btn"
                onClick={() => setShowFeedback(true)}
              >
                Rate Our Service
              </button>
            </div>
          )}
          <div className="col-lg-2 col-md-6 mb-4">
            <div className="footer-logo">
              <img src="/images/out bye.png" alt="Logo" className="footer-logo-img" />
              <p>Your go-to place for restaurants, cafes, tourist-places and hotels.</p>
            
            </div>
          </div>
          <div className="col-lg-2 col-md-6 mb-4">
            <h5>Important Links</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-white">Home</Link>
              </li>
              <li>
                <Link to="/about" className="text-white">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-white">Contact Us</Link>
              </li>
              <li>
                <Link to="#" className="text-white">FAQ</Link>
              </li>
              <li>
                <Link to="#" className="text-white">Privacy Policy</Link>
              </li>
              <li>
                <Link to="#" className="text-white">Terms & Conditions</Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-2 col-md-6 mb-4">
            <h4>Subscribe</h4>
            <p>Get the latest offers<br /> and updates directly in your inbox!</p>
            <div className="input-group mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                aria-label="Email"
                required
              />
              <button className="btn submit" type="submit">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
          <div className="col-lg-2 col-md-6 mb-4">
            <h5>Contact Information</h5>
            <p><strong>Phone:</strong> 01069504099</p>
            <p><strong>Email:</strong> outbyet@gmail.com</p>
            <p><strong>Address:</strong> Fayoum</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom text-center">
        <p>© 2024 All Rights Reserved. Designed and developed by our team.</p>
      </div>
      {isLoggedIn && userId && showFeedback && (
        <FeedbackPopup userId={userId} orderId={null} onClose={() => setShowFeedback(false)} />
      )}
    </footer>
  );
};

export default Footer;