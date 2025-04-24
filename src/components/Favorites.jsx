import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found. Please log in again.');

    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/x-www-form-urlencoded',
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Unauthorized: ${response.statusText}. Please log in again.`);
      }
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('Response from server is not valid JSON or is empty');
    }
    const jsonText = text.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonText);
  };

  const showAlert = (icon, title, text, redirectUrl = null) => {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: 'OK',
    }).then(() => {
      if (redirectUrl) navigate(redirectUrl);
    });
  };

  const fetchFavorites = async (userId) => {
    try {
      setLoading(true);
      const data = await fetchWithToken('https://abdulrahmanantar.com/outbye/favorite/view.php', {
        method: 'POST',
        body: new URLSearchParams({ id: userId }).toString(),
      });

      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        const uniqueItems = [];
        const seenItems = new Set();
        data.data.forEach((item) => {
          if (!seenItems.has(item.favorite_itemsid)) {
            seenItems.add(item.favorite_itemsid);
            uniqueItems.push(item);
          }
        });
        setFavorites(uniqueItems);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
      if (error.message.includes('Unauthorized')) {
        showAlert('error', 'Authentication Error', error.message, '/signin');
      } else if (error.message.includes('HTTP error')) {
        showAlert('error', 'Server Error', error.message);
      } else {
        showAlert('error', 'Error', 'An error occurred while fetching favorites: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (itemId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      showAlert('error', 'Error', 'User ID not found', '/signin');
      return;
    }

    try {
      const data = await fetchWithToken('https://abdulrahmanantar.com/outbye/favorite/remove.php', {
        method: 'POST',
        body: new URLSearchParams({ usersid: userId, itemsid: itemId }).toString(),
      });

      if (data.status === 'success') {
        showAlert('success', 'Removed!', 'The item has been removed from favorites.');
        setFavorites(favorites.filter((fav) => fav.favorite_itemsid !== itemId));
      } else {
        showAlert('error', 'Error', data.message || 'The server could not remove the item.');
      }
    } catch (error) {
      console.error('Error removing item from favorites:', error);
      if (error.message.includes('Unauthorized')) {
        showAlert('error', 'Authentication Error', error.message, '/signin');
      } else if (error.message.includes('HTTP error')) {
        showAlert('error', 'Server Error', error.message);
      } else {
        showAlert('error', 'Error', 'Error removing item: ' + error.message);
      }
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      showAlert('warning', 'Error', 'Please log in to view favorites.', '/signin');
      return;
    }
    fetchFavorites(userId);
  }, []);

  return (
    <div className="favorites-page">
      {loading ? (
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      ) : favorites.length > 0 ? (
        <div id="favorites-container">
          {favorites.map((item) => {
            const discount = parseFloat(item.items_discount) || 0;
            const price = parseFloat(item.items_price);
            const discountedPrice = discount > 0 ? (price - (price * discount / 100)).toFixed(2) : price;

            return (
              <div className="favorite-item" key={item.favorite_id} data-itemid={item.favorite_itemsid}>
                {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
                <img src={item.items_image} alt={item.items_name} onError={(e) => (e.target.src = 'images/out bye.png')} />
                <div className="favorite-info">
                  <h3>{item.items_name}</h3>
                  <div className="price-container">
                    {discount > 0 ? (
                      <>
                        <p className="original-price">{price} EGP</p>
                        <p className="discount-price">{discountedPrice} EGP</p>
                      </>
                    ) : (
                      <p>{price} EGP</p>
                    )}
                  </div>
                </div>
                <button className="remove-favorite-btn" onClick={() => removeFromFavorites(item.favorite_itemsid)}>
                  <i className="fas fa-trash"></i> Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '1.2rem' }}>No favorite items found.</p>
      )}
    </div>
  );
};

export default Favorites;