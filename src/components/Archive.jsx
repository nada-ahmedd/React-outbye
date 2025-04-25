import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import '../styles/Archive.css';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  ARCHIVE_ORDERS: `${API_BASE_URL}orders/archive.php`,
};

const Archive = () => {
  const navigate = useNavigate();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

const getStatusText = (status) => {
  const statusMap = {
    '0': 'Pending',
    '1': 'Processing',
    '2': 'Completed',
    '3': 'Cancelled',
  };
  return statusMap[status] || 'Unknown';
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
                <div className="order-header">
                  <h5>Order #{order.orders_id || 'N/A'}</h5>
                  {/* شيلنا الـ span بتاعة order-status */}
                </div>
                <div className="order-details">
                  <p>
                    <i className="fas fa-calendar"></i> <strong>Date:</strong>{' '}
                    {order.orders_datetime ? new Date(order.orders_datetime).toLocaleString('en-US') : 'N/A'}
                  </p>
                  <p>
                    <i className="fas fa-map-marker-alt"></i> <strong>Address:</strong>{' '}
                    {order.address_city || 'N/A'}, {order.address_street || 'N/A'}
                  </p>
                  <p>
                    <i className="fas fa-money-bill"></i> <strong>Price:</strong>{' '}
                    {order.orders_price ? order.orders_price + ' EGP' : 'N/A'}
                  </p>
                  <p>
                    <i className="fas fa-truck"></i> <strong>Delivery Fee:</strong>{' '}
                    {order.orders_pricedelivery ? order.orders_pricedelivery + ' EGP' : 'N/A'}
                  </p>
                  <p>
                    <i className="fas fa-wallet"></i> <strong>Total:</strong>{' '}
                    {order.orders_totalprice ? order.orders_totalprice + ' EGP' : 'N/A'}
                  </p>
                </div>
                <div className="order-actions">
                  <button className="btn" onClick={() => navigate(`/order-details?orderId=${order.orders_id}`)}>
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
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