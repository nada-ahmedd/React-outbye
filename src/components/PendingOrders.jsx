import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import '../styles/PendingOrders.css';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  PENDING_ORDERS: `${API_BASE_URL}orders/pending.php`,
};

const PendingOrders = () => {
  const navigate = useNavigate();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);

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
  }, [isLoggedIn, userId, navigate]);

  const loadPendingOrders = async () => {
    try {
      const response = await fetch(ENDPOINTS.PENDING_ORDERS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ userid: userId }).toString(),
      });
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load pending orders!' });
    }
  };

  return (
    <div className="orders-container">
      <h1>Pending Orders</h1>
      {orders.length === 0 ? (
        <div className="no-orders">No pending orders found.</div>
      ) : (
        orders.map((order) => (
          <div key={order.orders_id} className="order-card">
            <div className="order-info">
              <p><strong>Order ID:</strong> {order.orders_id}</p>
              <p><strong>Total Price:</strong> {order.orders_totalprice} EGP</p>
              <p><strong>Order Date:</strong> {order.orders_datetime}</p>
              <p><strong>Status:</strong> {order.orders_status === '0' ? 'Processing' : 'Completed'}</p>
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
  );
};

export default PendingOrders;