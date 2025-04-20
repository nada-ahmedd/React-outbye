import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { resetCart } from '../store/cartSlice';
import '../styles/Checkout.css';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  CHECKOUT: `${API_BASE_URL}orders/checkout.php`,
  VIEW_ADDRESSES: `${API_BASE_URL}address/view.php`,
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('0');
  const [totalPrice, setTotalPrice] = useState('0');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState('0');

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'You must log in first to complete the order!',
        confirmButtonText: 'Log In',
      }).then(() => navigate('/signin'));
      return;
    }

    // Check if there's saved checkout data in localStorage
    const savedCheckoutData = JSON.parse(localStorage.getItem('checkoutData')) || {};

    // Get parameters from URL
    const params = new URLSearchParams(location.search);
    const newTotalPrice = params.get('totalPrice') || savedCheckoutData.totalPrice || '0';
    const newCoupon = params.get('coupon') || savedCheckoutData.coupon || '';
    const newDiscount = params.get('discount') || savedCheckoutData.discount || '0';

    // Update state with either URL params or saved data
    setTotalPrice(newTotalPrice);
    setCoupon(newCoupon === 'N/A' ? '' : newCoupon);
    setDiscount(newDiscount);

    // Save checkout data to localStorage
    const checkoutData = {
      totalPrice: newTotalPrice,
      coupon: newCoupon || 'N/A',
      discount: newDiscount,
    };
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    console.log('Checkout Data Saved to localStorage:', checkoutData);

    loadAddresses();
  }, [isLoggedIn, userId, location, navigate]);

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
        return { status: "success", data: { order_id: "default-order-id" } };
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

  const loadAddresses = async () => {
    try {
      const data = await fetchWithToken(ENDPOINTS.VIEW_ADDRESSES, {
        method: 'POST',
        body: new URLSearchParams({ usersid: userId }).toString(),
      });
      if (data === null) return;
      if (data.status === 'success' && Array.isArray(data.data)) {
        setAddresses(data.data);
        localStorage.setItem('userAddresses', JSON.stringify(data.data));
      } else {
        setAddresses([]);
        localStorage.setItem('userAddresses', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
      localStorage.setItem('userAddresses', JSON.stringify([]));
      Swal.fire('error', 'Error', 'Failed to load addresses: ' + error.message);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!selectedAddress || selectedAddress === '0' || selectedAddress === '') {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a valid address!' });
      return;
    }

    if (selectedAddress.length > 10 || isNaN(selectedAddress)) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Invalid address ID! Please select another address.' });
      return;
    }

    const maxDiscount = 50;
    if (parseFloat(discount) > maxDiscount) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Discount percentage cannot exceed ${maxDiscount}%!` });
      return;
    }

    const minOrderPrice = 20;
    if (parseFloat(totalPrice) < minOrderPrice) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Total price must be at least ${minOrderPrice} EGP!` });
      return;
    }

    const formData = new URLSearchParams({
      usersid: userId,
      addressid: selectedAddress,
      pricedelivery: '10',
      ordersprice: totalPrice,
      couponid: coupon && !isNaN(coupon) ? coupon : '0',
      paymentmethod: paymentMethod,
      coupondiscount: discount || '0',
    });

    console.log('Form Data being sent:', formData.toString());

    try {
      const data = await fetchWithToken(ENDPOINTS.CHECKOUT, {
        method: 'POST',
        body: formData,
      });

      if (data === null) return;

      console.log('Parsed Checkout API Response:', data);

      // Clear data only after successful checkout
      localStorage.removeItem('checkoutData');
      localStorage.removeItem('cartItems');
      localStorage.removeItem('couponDiscount');
      localStorage.removeItem('couponId');
      dispatch(resetCart());

      await Swal.fire({
        icon: 'success',
        title: 'Order Successful',
        text: 'Your order has been placed successfully!',
        confirmButtonText: 'View Pending Orders',
      });
      navigate('/pending-orders');
    } catch (error) {
      console.error('Error during checkout:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'An error occurred while completing the order. Please try again later.' });
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <form onSubmit={handleCheckout}>
        <div className="form-group">
          <label htmlFor="price">Total Price (EGP)</label>
          <input type="text" id="price" value={totalPrice} readOnly />
        </div>
        <div className="form-group">
          <label htmlFor="payment-method">Payment Method</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            <option value="0">Cash</option>
            <option value="1">Payment Card</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="coupon-discount">Coupon Discount (%)</label>
          <input type="text" id="coupon-discount" value={discount} readOnly />
        </div>
        <div className="form-group">
          <label htmlFor="address">Select Address</label>
          <select
            id="address"
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            required
          >
            <option value="">Select an address</option>
            {addresses.map((address) => (
              <option key={address.address_id} value={address.address_id}>
                {`${address.address_name}, ${address.address_city}, ${address.address_street}, ${address.address_phone}`}
              </option>
            ))}
          </select>
          <a href="/addresses" className="btn secondary">Add/Edit Address</a>
        </div>
        <div className="action-buttons">
          <button type="submit" className="btn">Complete Order</button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;