import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import '../styles/Archive.css';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  ARCHIVE_ORDERS: `${API_BASE_URL}orders/archive.php`,
  SUBMIT_RATING: `${API_BASE_URL}rating.php`,
};

const Archive = () => {
  const navigate = useNavigate();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [activeOrder, setActiveOrder] = useState(null);
  const [ratingPopupOrder, setRatingPopupOrder] = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'You need to log in first!',
        confirmButtonText: 'Log In',
      }).then(() => navigate('/signin'));
      return;
    }

    loadArchiveOrders();
  }, [isLoggedIn, userId, navigate]);

  const fetchWithToken = async (url, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found, redirecting to login');
        await Swal.fire({
          icon: 'warning',
          title: 'Error',
          text: 'No authentication token found. Please log in again.',
        });
        navigate('/signin');
        throw new Error('No authentication token found. Please log in again.');
      }

      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      options.signal = controller.signal;

      console.log("Sending request to:", url);
      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status} - ${errorText}`);
        if (response.status === 401 || response.status === 403) {
          console.error('Unauthorized, clearing localStorage and redirecting');
          localStorage.clear();
          await Swal.fire({
            icon: 'warning',
            title: 'Error',
            text: 'Unauthorized. Please log in again.',
          });
          navigate('/signin');
          throw new Error('Unauthorized: Please log in again.');
        }
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const text = await response.text();
      console.log("Raw Response:", text);

      try {
        const data = text.trim() ? JSON.parse(text) : { status: "success" };
        console.log("Parsed Response:", data);
        return data;
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        if (text.includes('SQLSTATE[42000]') || text.includes('Undefined array key')) {
          return { status: "failure", message: "Server error, please try again later." };
        }
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 10 seconds');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the server.');
      }
      throw error;
    }
  };

  const loadArchiveOrders = async () => {
    setLoading(true);
    const formData = new URLSearchParams({ userid: userId });

    try {
      const response = await fetchWithToken(ENDPOINTS.ARCHIVE_ORDERS, {
        method: "POST",
        body: formData,
      });

      console.log("Archive Orders Response:", response);

      if (response.status === "success" && response.data && response.data.length > 0) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading archive orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (orderId) => {
    const rating = ratings[orderId] || 0;
    const comment = comments[orderId] || '';

    if (rating === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Rating Required',
        text: 'Please select a rating before submitting!',
      });
      return;
    }

    const formData = new URLSearchParams({
      orders_id: orderId,
      rating: rating,
      comment: comment,
    });

    try {
      const response = await fetchWithToken(ENDPOINTS.SUBMIT_RATING, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Rating Submitted',
          text: 'Thank you for your feedback!',
        });

        // إزالة البيانات المؤقتة بعد الإرسال
        setRatings((prev) => {
          const newRatings = { ...prev };
          delete newRatings[orderId];
          return newRatings;
        });

        setComments((prev) => {
          const newComments = { ...prev };
          delete newComments[orderId];
          return newComments;
        });

        setRatingPopupOrder(null);

        // إعادة تحميل الأوردرات لتحديث التقييم من الـ API
        await loadArchiveOrders();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to submit rating!',
        });
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to submit rating!',
      });
    }
  };

  const handleRatingChange = (orderId, rating) => {
    setRatings((prev) => ({
      ...prev,
      [orderId]: rating,
    }));
  };

  const handleCommentChange = (orderId, comment) => {
    setComments((prev) => ({
      ...prev,
      [orderId]: comment,
    }));
  };

  const toggleDetails = (orderId) => {
    setActiveOrder(activeOrder === orderId ? null : orderId);
  };

  const openRatingPopup = (orderId) => {
    setRatingPopupOrder(orderId);
  };

  const closeRatingPopup = () => {
    setRatingPopupOrder(null);
  };

  return (
    <div className="archive-page">
      <div className="main-content">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
        ) : (
          <div className="orders-container">
            {orders.length === 0 ? (
              <div className="no-orders">No orders found in archive</div>
            ) : (
              orders.map((order, index) => (
                <div key={index} className="archive-card">
                  <div className="card-header">
                    <div className="order-header" onClick={() => toggleDetails(order.orders_id)}>
                      <h5>Delivery Summary</h5>
                      <span className="toggle-icon">
                        <i className={`fas ${activeOrder === order.orders_id ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                      </span>
                    </div>
                  </div>
                  <div className={`order-details ${activeOrder === order.orders_id ? 'active' : ''}`}>
                    <p>
                      <i className="fas fa-calendar animate-icon"></i> <strong>Date:</strong>{' '}
                      {order.orders_datetime ? new Date(order.orders_datetime).toLocaleString('en-US') : 'N/A'}
                    </p>
                    <p>
                      <i className="fas fa-map-marker-alt animate-icon"></i> <strong>Address:</strong>{' '}
                      {order.address_city || 'N/A'}, {order.address_street || 'N/A'}
                    </p>
                    <p>
                      <i className="fas fa-money-bill animate-icon"></i> <strong>Price:</strong>{' '}
                      {order.orders_price ? order.orders_price + ' EGP' : 'N/A'}
                    </p>
                    <p>
                      <i className="fas fa-truck animate-icon"></i> <strong>Delivery Fee:</strong>{' '}
                      {order.orders_pricedelivery ? order.orders_pricedelivery + ' EGP' : 'N/A'}
                    </p>
                    <p>
                      <i className="fas fa-wallet animate-icon"></i> <strong>Total:</strong>{' '}
                      {order.orders_totalprice ? order.orders_totalprice + ' EGP' : 'N/A'}
                    </p>
                  </div>
                  <div className="rating-section">
                    <h6>Your Feedback:</h6>
                    {parseInt(order.orders_rating) > 0 ? (
                      <div className="submitted-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${parseInt(order.orders_rating) >= star ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {order.orders_noterating && (
                          <p className="submitted-comment">
                            <strong>Comment:</strong> {order.orders_noterating}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn-share-thoughts"
                        onClick={() => openRatingPopup(order.orders_id)}
                      >
                        <i className="fas fa-heart"></i> Share Your Thoughts
                      </button>
                    )}
                  </div>
                  <div className="order-actions">
                    <button
                      className="btn view-details"
                      onClick={() => navigate(`/order-details?orderId=${order.orders_id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {ratingPopupOrder && (
          <div className="rating-popup">
            <div className="rating-popup-content">
              <button className="close-popup" onClick={closeRatingPopup}>
                <i className="fas fa-times"></i>
              </button>
              <h5>Share Your Thoughts</h5>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${ratings[ratingPopupOrder] >= star ? 'filled' : ''}`}
                    onClick={() => handleRatingChange(ratingPopupOrder, star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                className="comment-input"
                placeholder="Add your comment (optional)"
                value={comments[ratingPopupOrder] || ''}
                onChange={(e) => handleCommentChange(ratingPopupOrder, e.target.value)}
              />
              <button
                className="btn submit-rating"
                onClick={() => submitRating(ratingPopupOrder)}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}
        <button className="btn-refresh" onClick={loadArchiveOrders}>
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>
  );
};

export default Archive;