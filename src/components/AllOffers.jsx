import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCart } from '../store/cartSlice';
import Swal from 'sweetalert2';
import '../styles/AllOffers.css';

const AllOffers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth || {});
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffersData = async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      console.log('Raw Response from', url, ':', text);

      const trimmedText = text.trim();
      const jsonMatch = trimmedText.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.error('No valid JSON array found in response:', trimmedText);
        return [];
      }

      const jsonText = jsonMatch[0];
      console.log('Extracted JSON:', jsonText);

      try {
        const parsedData = JSON.parse(jsonText);
        console.log('Parsed Offers Data:', parsedData);
        return parsedData;
      } catch (e) {
        console.error('Error parsing JSON:', e, 'Extracted Text:', jsonText);
        return [];
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      return [];
    }
  };

  const fetchOffers = async () => {
    const offersUrl = "https://abdulrahmanantar.com/outbye/offers.php";
    setLoading(true);
    try {
      const data = await fetchOffersData(offersUrl);
      if (Array.isArray(data) && data.length > 0) {
        setOffers(data);
      } else {
        setOffers([]);
        Swal.fire({
          icon: 'info',
          title: 'No Offers Available',
          text: 'Stay tuned for exciting deals!',
        });
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load offers.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (itemId, type = 'offer') => {
    if (!itemId) {
      console.error('Error: Item ID is undefined or null');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid offer ID. Please try again.',
      });
      return;
    }

    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Error",
        text: "Please log in first to add the offer to the cart.",
        confirmButtonText: "Log In",
        showCancelButton: true,
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
      return;
    }

    try {
      await dispatch(addToCart({ userId, itemId: String(itemId), quantity: 1, type })).unwrap();
      Swal.fire({
        icon: "success",
        title: "✅ Added!",
        text: "Offer added to cart successfully.",
        confirmButtonText: "OK"
      });
      dispatch(fetchCart(userId));
    } catch (error) {
      console.error('Error adding to cart:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to add offer to cart: ${error}`,
        confirmButtonText: "OK"
      });
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="all-offers-page">
      <h1 className="all-offers-title">All Special Offers</h1>
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : offers.length === 0 ? (
        <p className="no-offers-message">No offers available at the moment.</p>
      ) : (
        <div className="offers-grid">
          {offers.map((offer, index) => (
            <div className="offer-card" key={offer.id || `offer-${index}`}>
              <div className="offer-image-wrapper">
                <img
                  src={offer.image || 'images/out bye.png'}
                  alt={offer.title || 'Offer'}
                  onError={(e) => (e.target.src = 'images/out bye.png')}
                  loading="lazy"
                />
              </div>
              <div className="offer-details">
                <p className="offer-restaurant">{offer.service_name || 'Unknown Restaurant'}</p>
                <h3>{offer.title || 'Special Offer'}</h3>
                <div className="offer-details-content">
                  <div className="offer-text">
                    <p className="offer-description">{offer.description || 'Check Out This Deal'}</p>
                    <p className="offer-price">{offer.price || 'N/A'} EGP</p>
                    <button
                      className="offer-add-to-cart"
                      onClick={() => handleAddToCart(offer.id, 'offer')}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllOffers;