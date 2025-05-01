import React, { useState } from 'react';
import Swal from 'sweetalert2';
import '../styles/FeedbackPopup.css';

const FeedbackPopup = ({ orderId, userId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [serviceType, setServiceType] = useState('');

  const handleStarClick = (index) => setRating(index + 1);

  const submitFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire({ icon: 'error', text: 'No authentication token found. Please log in again.' });
        return;
      }

      const formData = new URLSearchParams({
        user_id: userId,
        rating,
        comment,
        service_type: serviceType,
        order_id: orderId,
      });

      const response = await fetch('https://abdulrahmanantar.com/outbye/user_review/add_review.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Swal.fire({ icon: 'error', text: 'Please log in again.' });
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { success: false, message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }

      if (data.success) {
        Swal.fire({ icon: 'success', text: data.message });
        onClose();
      } else {
        Swal.fire({ icon: 'error', text: data.message || 'Failed to submit review' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', text: 'An error occurred while submitting the review' });
    }
  };

  return (
    <div className="feedback-popup">
      <h3>Rate Your Experience</h3>
      <div className="stars">
        {[...Array(5)].map((_, index) => (
          <i
            key={index}
            className={`fas fa-star ${index < rating ? 'active' : ''} cursor-pointer text-xl`}
            onClick={() => handleStarClick(index)}
          />
        ))}
      </div>
      <input
        type="text"
        placeholder="Service Type "
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value)}
        className="service-type-input"
      />
      <textarea
        placeholder="Write your comment here..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows="4"
        className="comment-textarea"
      />
      <button onClick={submitFeedback} className="submit-btn">
        Submit Review
      </button>
      <button onClick={onClose} className="close-btn">
        Close
      </button>
    </div>
  );
};

export default FeedbackPopup;