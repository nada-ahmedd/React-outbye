import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import '../styles/OrderDetails.css';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  ORDER_DETAILS: `${API_BASE_URL}orders/details.php`,
};

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);

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

    loadOrderDetails();
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
            icon: 'warning"',
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

  const loadOrderDetails = async () => {
    const urlParams = new URLSearchParams(location.search);
    const orderId = urlParams.get("orderId");

    if (!orderId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Order ID not found!',
        confirmButtonText: 'Back',
      }).then(() => navigate('/pending-orders'));
      return;
    }

    const formData = new URLSearchParams({
      ordersid: orderId,
    });

    try {
      const response = await fetchWithToken(ENDPOINTS.ORDER_DETAILS, {
        method: 'POST',
        body: formData,
      });

      console.log("Order Details Response:", response);

      if (response.status === 'success' && response.data && response.data.length > 0) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load order details!',
      });
    }
  };

  return (
    <div className="order-details-page">
      <h1>Order Details</h1>
      <div className="order-details-container" id="orderDetailsContainer">
        <h3>Order Items</h3>
        <div className="items-list">
          {items.length === 0 ? (
            <p className="no-items">No items found in this order.</p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="item">
                <img
                  src={item.items_image || 'images/out bye.png'}
                  alt={item.items_name}
                  onError={(e) => (e.target.src = 'images/out bye.png')}
                />
                <div className="item-info">
                  <p><strong>Product Name:</strong> {item.items_name}</p>
                  <p><strong>Price:</strong> {item.items_price} EGP</p>
                  <p><strong>Quantity:</strong> {item.cart_quantity}</p>
                  <p><strong>Description:</strong> {item.items_des}</p>
                </div>
              </div>
            ))
          )}
        </div>
       
      </div>
    </div>
  );
};

export default OrderDetails;