import React from 'react';
import Swal from 'sweetalert2';
import '../styles/Contact.css';

const Contact = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const name = event.target.name.value.trim();
    const email = event.target.email.value.trim();
    const phone = event.target.phone.value.trim();
    const message = event.target.message.value.trim();

    if (!name || !email || !phone || !message) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill all fields.',
      });
      return;
    }

    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Message Sent!',
        text: 'Your message has been sent successfully.',
        timer: 2000,
      });
      event.target.reset();
    }, 500);
  };

  return (
    <main className="contact-page">
      <div className="container-contact">
        <div className="contact-info">
          <h3>
            <span className="icon">📞</span> Call To Us
          </h3>
          <p>We are available 24/7, 7 days a week.</p>
          <p>Phone: 01069504099</p>
          <hr />
          <h3>
            <span className="icon">✉️</span> Write To Us
          </h3>
          <p>Fill out our form and we will contact you within 24 hours.</p>
          <p>Email: outbyet@gmail.com</p>
        </div>

        <div className="contact-form">
          <form id="contactForm" action="https://formspree.io/f/xvgkggpj" method="POST" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Your Name *" required />
            <input type="email" name="email" placeholder="Your Email *" required />
            <input type="text" name="phone" placeholder="Your Phone *" required />
            <textarea name="message" placeholder="Your Message" required></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Contact;