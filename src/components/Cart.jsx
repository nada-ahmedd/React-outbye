import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { fetchCart, increaseItemQuantity, decreaseItemQuantity, applyCoupon } from '../store/cartSlice';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const { items, status, error, couponDiscount, isCouponApplied } = useSelector((state) => state.cart);
  const [couponInput, setCouponInput] = useState('');

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'Please log in first to view the cart.',
        confirmButtonText: 'Log In',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
      return;
    }

    dispatch(fetchCart(userId));
  }, [dispatch, userId, isLoggedIn, navigate]);

  const handleIncrease = (itemId) => {
    const isOffer = items.offers.some(item => item.cart_itemsid === itemId);
    const type = isOffer ? 'offer' : 'item';
    
    dispatch(increaseItemQuantity({ userId, itemId, type }));
  };

  const handleDecrease = (itemId) => {
    const isOffer = items.offers.some(item => item.cart_itemsid === itemId);
    const type = isOffer ? 'offer' : 'item';
    
    dispatch(decreaseItemQuantity({ userId, itemId, type }));
  };

  const handleApplyCoupon = () => {
    if (!couponInput) {
      Swal.fire({ icon: 'warning', title: 'Error', text: 'Please enter a coupon code!' });
      return;
    }
    dispatch(applyCoupon({ userId, couponName: couponInput })).then((action) => {
      if (action.type === applyCoupon.fulfilled.type) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Coupon applied successfully! ${couponDiscount}% discount`,
        });
        setCouponInput('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: action.payload || 'Failed to apply coupon',
        });
      }
    });
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'Please log in first to proceed to checkout.',
        confirmButtonText: 'Log In',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
      return;
    }

    const totalPrice = calculateTotalPrice();
    const cartCount = calculateTotalCount();
    if (cartCount === 0) {
      Swal.fire({ icon: 'warning', title: 'Cart is Empty', text: 'Please add items to the cart first!' });
      return;
    }

    navigate(`/checkout?totalPrice=${totalPrice}&coupon=${couponInput}&discount=${couponDiscount}`);
  };

  const calculateTotalPrice = () => {
    let total = 0;
    const categories = [items.rest_cafe, items.hotel_tourist, ...(items.other_categories || [])];
    categories.forEach(category => {
      if (category?.datacart) {
        category.datacart.forEach(item => {
          const originalPrice = parseFloat(item.price) || 0;
          const discount = parseFloat(item.discount) || 0;
          const discountedPrice = discount > 0 ? (originalPrice * (1 - discount / 100)) : originalPrice;
          const quantity = parseInt(item.cart_quantity) || 0;
          total += discountedPrice * quantity;
        });
      }
    });
    if (items.offers?.length > 0) {
      items.offers.forEach(item => {
        const originalPrice = parseFloat(item.price) || 0;
        const discount = parseFloat(item.discount) || 0;
        const discountedPrice = discount > 0 ? (originalPrice * (1 - discount / 100)) : originalPrice;
        const quantity = parseInt(item.cart_quantity) || 0;
        total += discountedPrice * quantity;
      });
    }
    const discountAmount = (total * couponDiscount) / 100;
    return (total - discountAmount > 0 ? total - discountAmount : 0).toFixed(2);
  };

  const calculateTotalCount = () => {
    let count = 0;
    const categories = [items.rest_cafe, items.hotel_tourist, ...(items.other_categories || [])];
    categories.forEach(category => {
      if (category?.datacart) {
        count += category.datacart.reduce((sum, item) => sum + (parseInt(item.cart_quantity) || 0), 0);
      }
    });
    if (items.offers?.length > 0) {
      count += items.offers.reduce((sum, item) => sum + (parseInt(item.cart_quantity) || 0), 0);
    }
    return count;
  };

  const renderCartItem = (item) => {
    const originalPrice = parseFloat(item.price) || 0;
    const discount = parseFloat(item.discount) || 0;
    const discountedPrice = discount > 0 ? (originalPrice * (1 - discount / 100)) : originalPrice;
    const quantity = parseInt(item.cart_quantity) || 0;
    const totalPriceAfterDiscount = discountedPrice * quantity;

    return (
      <tr key={item.cart_id} id={`cart-item-${item.cart_id}`} data-price={originalPrice} data-discount={discount}>
        <td data-label="Image">
          <img src={item.image} alt={item.name} className="cart-item-image" />
        </td>
        <td data-label="Product Name">{item.name}</td>
        <td data-label="Price">
          {discount > 0 ? (
            <>
              <span className="original-price">{originalPrice} EGP</span>
              <span className="discounted-price">{discountedPrice.toFixed(2)} EGP</span>
            </>
          ) : (
            <span>{originalPrice} EGP</span>
          )}
        </td>
        <td data-label="Quantity" className="quantity-controls">
          <button className="decrease-btn" onClick={() => handleDecrease(item.cart_itemsid)}>
            <i className="fas fa-minus"></i>
          </button>
          <span id={`quantity-${item.cart_itemsid}`} className="quantity">{quantity}</span>
          <button className="increase-btn" onClick={() => handleIncrease(item.cart_itemsid)}>
            <i className="fas fa-plus"></i>
          </button>
        </td>
        <td data-label="Total" id={`total-${item.cart_itemsid}`}>{totalPriceAfterDiscount.toFixed(2)} EGP</td>
      </tr>
    );
  };

  const renderCartItems = () => {
    if (status === 'loading') return <tr><td colSpan="5" className="loading-text">Loading...</td></tr>;
    if (status === 'failed') return <tr><td colSpan="5" className="error-text">⚠️ Error fetching data: {error}</td></tr>;

    let cartHTML = [];
    let hasItems = false;

    if (items.rest_cafe?.datacart?.length > 0) {
      hasItems = true;
      cartHTML.push(
        <tr key="rest_cafe-divider" className="section-divider">
          <td colSpan="5" className="section-title">Restaurants & Cafes</td>
        </tr>,
        ...items.rest_cafe.datacart.map(item => renderCartItem(item))
      );
    }

    if (items.hotel_tourist?.datacart?.length > 0) {
      hasItems = true;
      cartHTML.push(
        <tr key="hotel_tourist-divider" className="section-divider">
          <td colSpan="5" className="section-title">Hotels & Tourist Places</td>
        </tr>,
        ...items.hotel_tourist.datacart.map(item => renderCartItem(item))
      );
    }

    if (items.offers?.length > 0) {
      hasItems = true;
      cartHTML.push(
        <tr key="offers-divider" className="section-divider">
          <td colSpan="5" className="section-title">Special Offers</td>
        </tr>,
        ...items.offers.map(item => renderCartItem(item))
      );
    }

    if (items.other_categories && Object.keys(items.other_categories).length > 0) {
      Object.values(items.other_categories).forEach(category => {
        if (category.datacart?.length > 0) {
          hasItems = true;
          cartHTML.push(
            <tr key={`${category.cat_name}-divider`} className="section-divider">
              <td colSpan="5" className="section-title">{category.cat_name || 'Other Categories'}</td>
            </tr>,
            ...category.datacart.map(item => renderCartItem(item))
          );
        }
      });
    }

    if (!hasItems) return <tr><td colSpan="5" className="empty-section">🛒 Cart is empty.</td></tr>;
    return cartHTML;
  };

  return (
    <div className="cart-container">
      <h2 className="cart-title">Your Cart</h2>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="cart-items">{renderCartItems()}</tbody>
      </table>
      <div className="cart-actions">
        <a href="/" className="continue-shopping-btn">Continue Shopping</a>
        <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
      </div>
      <div className="cart-footer">
        <div className="coupon">
          <input
            type="text"
            id="coupon-input"
            placeholder="Enter Coupon Code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            disabled={isCouponApplied}
            className="coupon-input"
          />
          <button
            className="apply-coupon-btn"
            onClick={handleApplyCoupon}
            disabled={isCouponApplied}
          >
            Apply Coupon
          </button>
        </div>
        <div className="cart-total">
          <h4>Cart Summary</h4>
          <p>Number of Items: <span id="cart-count">{calculateTotalCount()}</span></p>
          <p>Total: <span id="total-price">{calculateTotalPrice()} EGP</span></p>
          {couponDiscount > 0 && (
            <p>Discount Applied: <span>{couponDiscount}%</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;