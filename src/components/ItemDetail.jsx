import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Add useDispatch
import { fetchCart } from '../store/cartSlice'; // Import fetchCart
import Swal from 'sweetalert2';
import '../styles/ItemDetail.css';

const ItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const serviceId = query.get('service_id');
  const dispatch = useDispatch(); // Initialize dispatch
  const [item, setItem] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState({});

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const excludedAPIs = ["offers.php", "categories.php", "topselling.php", "services.php", "items.php", "search.php"];
    const isExcluded = excludedAPIs.some(api => url.includes(api));
    options.headers = {
      ...options.headers,
      ...(isExcluded ? {} : { 'Authorization': `Bearer ${token}` }),
      "Content-Type": options.headers?.["Content-Type"] || "application/x-www-form-urlencoded"
    };
    const response = await fetch(url, options);
    const text = await response.text();
    let data = { status: "success" };
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd > 0) {
        const jsonText = text.substring(jsonStart, jsonEnd);
        data = JSON.parse(jsonText);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
    return data;
  };

  const isLoggedIn = () => {
    return !!localStorage.getItem("userId") && localStorage.getItem("isLoggedIn") === "true" && !!localStorage.getItem("token");
  };

  const fetchItem = async () => {
    if (!itemId || !serviceId) {
      console.error("❌ No item ID or service ID found!");
      setLoading(false);
      navigate('/');
      return;
    }

    setLoading(true);
    const apiUrl = `https://abdulrahmanantar.com/outbye/items/items.php?t=${new Date().getTime()}`;
    try {
      const data = await fetchWithToken(apiUrl, {
        method: "POST",
        body: new URLSearchParams({ id: serviceId }).toString()
      });
      if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
        const itemData = data.data.find(item => item.items_id === itemId);
        if (itemData) {
          setItem(itemData);
          setServiceDetails({
            service_name: itemData.service_name,
            service_image: itemData.service_image,
            service_description: itemData.service_description,
            service_location: itemData.service_location,
            service_rating: itemData.service_rating,
            service_phone: itemData.service_phone,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Item Not Found',
            text: 'The requested item was not found.',
          });
          navigate('/');
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Item',
          text: 'Unable to fetch item. Please try again later.',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching the item.',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (userId) => {
    if (!isLoggedIn()) return;

    try {
      const data = await fetchWithToken("https://abdulrahmanantar.com/outbye/favorite/view.php", {
        method: "POST",
        body: new URLSearchParams({ id: userId }).toString()
      });
      if (data.status === "success" && Array.isArray(data.data)) {
        const favoritesMap = {};
        data.data.forEach(item => {
          favoritesMap[item.favorite_itemsid] = item.favorite_id;
        });
        setFavorites(favoritesMap);
      }
    } catch (error) {
      console.error("❌ Error fetching favorites:", error);
    }
  };

  const addToCart = async (itemId) => {
    if (!isLoggedIn()) {
      Swal.fire({
        title: "⚠️ Login Required",
        text: "Please log in to add items to your cart.",
        icon: "warning",
        showCancelButton: true,
        cancelButtonText: "Continue Browsing",
        confirmButtonText: "Login",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/signin");
        }
      });
      return;
    }

    const userId = localStorage.getItem("userId");
    try {
      const data = await fetchWithToken("https://abdulrahmanantar.com/outbye/cart/add.php", {
        method: "POST",
        body: new URLSearchParams({ usersid: userId, itemsid: itemId, quantity: 1 }).toString()
      });
      if (data.success) {
        Swal.fire("✅ Added!", "Item successfully added to cart.", "success");
        // Fetch updated cart to update Navbar icon
        dispatch(fetchCart(userId));
      } else {
        Swal.fire("❌ Error", data.message || "Failed to add item to cart.", "error");
      }
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      Swal.fire("❌ Error", "An error occurred while adding the item to the cart.", "error");
    }
  };

  const toggleFavorite = async (itemId) => {
    if (!isLoggedIn()) {
      Swal.fire({
        title: "⚠️ Login Required",
        text: "Please log in to add items to your favorites.",
        icon: "warning",
        showCancelButton: true,
        cancelButtonText: "Continue Browsing",
        confirmButtonText: "Login",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/signin");
        }
      });
      return;
    }

    const userId = localStorage.getItem("userId");
    const isFavorited = !!favorites[itemId];

    if (!isFavorited) {
      try {
        const data = await fetchWithToken("https://abdulrahmanantar.com/outbye/favorite/add.php", {
          method: "POST",
          body: new URLSearchParams({ usersid: userId, itemsid: itemId }).toString()
        });
        if (data.status === "success") {
          Swal.fire("✅ Added!", "Item successfully added to favorites.", "success");
          setFavorites(prev => ({ ...prev, [itemId]: data.favorite_id || true }));
        } else if (data.status === "fail") {
          Swal.fire("⚠️ Already Added", "This item is already in your favorites.", "info");
        } else {
          Swal.fire("❌ Error", data.message || "The server could not add the item.", "error");
        }
      } catch (error) {
        console.error("❌ Error adding to favorites:", error);
        Swal.fire("❌ Error", "An error occurred while adding the item to favorites.", "error");
      }
    } else {
      const favId = favorites[itemId];
      if (!favId) {
        Swal.fire("❌ Error", "Favorite ID not available.", "error");
        fetchFavorites(userId);
        return;
      }

      try {
        const data = await fetchWithToken("https://abdulrahmanantar.com/outbye/favorite/deletefromfavroite.php", {
          method: "POST",
          body: new URLSearchParams({ id: favId }).toString()
        });
        if (data.status === "success") {
          Swal.fire("✅ Removed!", "Item successfully removed from favorites.", "success");
          setFavorites(prev => {
            const newFavorites = { ...prev };
            delete newFavorites[itemId];
            return newFavorites;
          });
        } else {
          Swal.fire("❌ Error", data.message || "The server could not remove the item.", "error");
        }
      } catch (error) {
        console.error("❌ Error deleting favorite:", error);
        Swal.fire("❌ Error", "An error occurred while removing the item.", "error");
      }
    }
  };

  useEffect(() => {
    fetchItem();
    if (isLoggedIn()) {
      const userId = localStorage.getItem("userId");
      fetchFavorites(userId);
    }
  }, [itemId, serviceId]);

  useEffect(() => {
    const itemObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target.querySelector('.item-image');
            if (img && img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.item-detail').forEach(item => itemObserver.observe(item));

    return () => {
      itemObserver.disconnect();
    };
  }, [item]);

  return (
    <main>
      {/* Service Details */}
      <div id="service-details">
        {serviceDetails ? (
          <div className="service-card">
            <div className="service-header">
              <img
                src={serviceDetails.service_image || 'images/out bye.png'}
                alt={serviceDetails.service_name}
                className="service-img"
                onError={(e) => (e.target.src = 'images/out bye.png')}
              />
              <h2>{serviceDetails.service_name}</h2>
            </div>
            <p>{serviceDetails.service_description}</p>
            <p><i className="fas fa-map-marker-alt"></i> Location: {serviceDetails.service_location}</p>
            <p className="rating">⭐ Rating: {serviceDetails.service_rating}</p>
            <p><i className="fas fa-phone"></i> Phone: <a href={`tel:${serviceDetails.service_phone}`}>{serviceDetails.service_phone}</a></p>
          </div>
        ) : (
          <p>Loading service details...</p>
        )}
      </div>

      {/* Item Details */}
      <div id="item-detail-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
        ) : item ? (
          <div className="item-detail">
            <h3>{item.items_name}</h3>
            <p>{item.items_des}</p>
            <p className="price">
              {item.items_discount > 0 ? (
                <>
                  <span className="old-price">{item.items_price} EGP</span>
                  <span className="new-price">{(item.items_price - (item.items_price * item.items_discount / 100)).toFixed(2)} EGP</span>
                </>
              ) : (
                <span className="regular-price">{item.items_price} EGP</span>
              )}
            </p>
            <p className="discount">{item.items_discount > 0 ? `Discount: ${item.items_discount}%` : ''}</p>
            <img
              src={item.items_image || '/images/out bye.png'}
              alt={item.items_name}
              className="item-image"
              onError={(e) => (e.target.src = '/images/out bye.png')}
            />
            <div className="item-actions">
              <button className="addItem-to-cart" onClick={() => addToCart(item.items_id)}>
                Add to Cart
              </button>
              <button className="favorite-btn" onClick={() => toggleFavorite(item.items_id)}>
                <i className={`fa-heart ${favorites[item.items_id] ? 'fa-solid' : 'fa-regular'}`} style={{ color: favorites[item.items_id] ? '#F26B0A' : '#333' }}></i>
              </button>
            </div>
          </div>
        ) : (
          <p>🚫 Item not found.</p>
        )}
      </div>
    </main>
  );
};

export default ItemDetail;