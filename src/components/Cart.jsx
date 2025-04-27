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
    // Check if the item is an offer
    const isOffer = items.offers.some(item => item.cart_itemsid === itemId);
    const type = isOffer ? 'offer' : 'item';
    
    dispatch(increaseItemQuantity({ userId, itemId, type }));
  };

  const handleDecrease = (itemId) => {
    // Check if the item is an offer
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
    // Other categories
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
    // Offers
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
    // Other categories
    const categories = [items.rest_cafe, items.hotel_tourist, ...(items.other_categories || [])];
    categories.forEach(category => {
      if (category?.datacart) {
        count += category.datacart.reduce((sum, item) => sum + (parseInt(item.cart_quantity) || 0), 0);
      }
    });
    // Offers
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
        <td>
          <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
        </td>
        <td>{item.name}</td>
        <td>
          {discount > 0 ? (
            <>
              <span className="original-price text-muted text-decoration-line-through me-2">{originalPrice} EGP</span>
              <span className="discounted-price text-success">{discountedPrice.toFixed(2)} EGP</span>
            </>
          ) : (
            <span>{originalPrice} EGP</span>
          )}
        </td>
        <td className="d-flex align-items-center gap-2">
          <button className="btn btn-danger btn-sm decrease-item-btn" onClick={() => handleDecrease(item.cart_itemsid)}>
            <i className="fas fa-minus"></i>
          </button>
          <span id={`quantity-${item.cart_itemsid}`} className="fs-5 fw-bold">{quantity}</span>
          <button className="btn btn-success btn-sm increase-item-btn" onClick={() => handleIncrease(item.cart_itemsid)}>
            <i className="fas fa-plus"></i>
          </button>
        </td>
        <td id={`total-${item.cart_itemsid}`}>{totalPriceAfterDiscount.toFixed(2)} EGP</td>
      </tr>
    );
  };

  const renderCartItems = () => {
    if (status === 'loading') return <tr><td colSpan="5">Loading...</td></tr>;
    if (status === 'failed') return <tr><td colSpan="5">⚠️ Error fetching data: {error}</td></tr>;

    let cartHTML = [];
    let hasItems = false;

    // Restaurants & Cafes
    if (items.rest_cafe?.datacart?.length > 0) {
      hasItems = true;
      cartHTML.push(
        <tr key="rest_cafe-divider" className="section-divider">
          <td colSpan="5" className="section-title">Restaurants & Cafes</td>
        </tr>,
        ...items.rest_cafe.datacart.map(item => renderCartItem(item))
      );
    }

    // Hotels & Tourist Places
    if (items.hotel_tourist?.datacart?.length > 0) {
      hasItems = true;
      cartHTML.push(
        <tr key="hotel_tourist-divider" className="section-divider">
          <td colSpan="5" className="section-title">Hotels & Tourist Places</td>
        </tr>,
        ...items.hotel_tourist.datacart.map(item => renderCartItem(item))
      );
    }

    // Offers
    if (items.offers?.length > 0) {
      hasItems = true;
      cartHTML.push(
        <tr key="offers-divider" className="section-divider">
          <td colSpan="5" className="section-title">Special Offers</td>
        </tr>,
        ...items.offers.map(item => renderCartItem(item))
      );
    }

    // Other Categories
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
        <a href="/" className="btn btn-primary">Continue Shopping</a>
        <button className="btn btn-success" onClick={handleCheckout}>Checkout</button>
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
          />
          <button
            className="btn"
            onClick={handleApplyCoupon}
            disabled={isCouponApplied}
          >
            Apply
          </button>
        </div>
        <div className="cart-total">
          <h4>Cart Total</h4>
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