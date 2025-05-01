// src/components/PendingOrders.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import FeedbackPopup from './FeedbackPopup';
import '../styles/PendingOrders.css';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  PENDING_ORDERS: `${API_BASE_URL}orders/pending.php`,
  DELETE_ORDER: `${API_BASE_URL}orders/delete.php`,
};

const PendingOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState(null);

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

    loadPendingOrders();

    // Check URL for order status change
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    const status = params.get('status');
    if (orderId && (status === 'approved' || status === 'rejected')) {
      setFeedbackOrderId(orderId);
      setShowFeedback(true);
    }
  }, [isLoggedIn, userId, navigate, location]);

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

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchWithToken(ENDPOINTS.PENDING_ORDERS, {
        method: 'POST',
        body: new URLSearchParams({ userid: userId }).toString(),
      });
      if (response.status === 'success' && response.data) {
        const pendingOrders = response.data.filter(order => order.orders_status === '0');
        setOrders(pendingOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load pending orders!' });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    const formData = new URLSearchParams({
      ordersid: orderId,
    });

    try {
      const response = await fetchWithToken(ENDPOINTS.DELETE_ORDER, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Order deleted successfully!',
          confirmButtonText: 'OK',
        });
        setOrders(orders.filter(order => order.orders_id !== orderId));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to delete the order!',
        });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete the order!',
      });
    }
  };

  return (
    <div className="orders-container">
      <h1>Pending Orders</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <div className="no-orders">No pending orders found.</div>
      ) : (
        orders.map((order) => (
          <div key={order.orders_id} className="order-card">
            <div className="order-info">
              <p><strong>Order ID:</strong> {order.orders_id}</p>
              <p><strong>Total Price:</strong> {order.orders_totalprice} EGP</p>
              <p><strong>Order Date:</strong> {order.orders_datetime}</p>
              <p><strong>Status:</strong> Processing</p>
            </div>
            <div className="order-actions">
              <button className="btn" onClick={() => navigate(`/order-details?orderId=${order.orders_id}`)}>
                View Details
              </button>
              <button className="btn delete" onClick={() => deleteOrder(order.orders_id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
      {showFeedback && feedbackOrderId && (
        <FeedbackPopup
          orderId={feedbackOrderId}
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
};

export default PendingOrders;