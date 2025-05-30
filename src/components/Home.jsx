import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite, fetchFavorites } from '../store/favoritesSlice';
import { fetchCart, addToCart } from '../store/cartSlice';
import Swal from 'sweetalert2';
import Glide from '@glidejs/glide';
import Banner from './Banner';
import '@glidejs/glide/dist/css/glide.core.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const favoritesState = useSelector((state) => state.favorites || { items: [], status: 'idle', error: null });
  const { items: favorites, status: favoritesStatus, error: favoritesError } = favoritesState;
  const { userId } = useSelector((state) => state.auth || {});
  const { status: cartStatus, error: cartError } = useSelector((state) => state.cart || { status: 'idle', error: null });
  const [categories, setCategories] = useState([]);
  const [discountItems, setDiscountItems] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOfferId, setActiveOfferId] = useState(null);
  const discountRef = useRef(null);
  const topSellingRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [showFeedbackFields, setShowFeedbackFields] = useState(false);

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const excludedAPIs = ["categories.php", "topselling.php", "services.php", "items.php", "search.php", "home.php"];
    const isExcluded = excludedAPIs.some(api => url.includes(api));
    options.headers = {
      ...options.headers,
      ...(isExcluded ? {} : { 'Authorization': `Bearer ${token}` }),
      "Content-Type": "application/json"
    };
    try {
      const response = await fetch(url, options);
      let text = await response.text();
      console.log('Raw Response:', text);
      const jsonMatch = text.match(/{.*}/s);
      if (jsonMatch) {
        text = jsonMatch[0];
      } else {
        text = '{}';
      }
      try {
        const data = JSON.parse(text);
        return data.status ? data : { status: "success", ...data };
      } catch (e) {
        console.error('Error parsing JSON:', e, 'Raw response:', text);
        return { status: "error", message: "Invalid JSON response" };
      }
    } catch (error) {
      console.error('Fetch error:', error);
      return { status: "error", message: error.message };
    }
  };

  const fetchWithTokenForDiscount = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const excludedAPIs = ["categories.php", "topselling.php", "services.php", "items.php", "search.php", "home.php"];
    const isExcluded = excludedAPIs.some(api => url.includes(api));
    options.headers = {
      ...options.headers,
      ...(isExcluded ? {} : { 'Authorization': `Bearer ${token}` }),
      "Content-Type": "application/json"
    };
    try {
      const response = await fetch(url, options);
      let text = await response.text();
      console.log('Raw Response:', text);
      const jsonMatch = text.match(/{.*}/s);
      if (jsonMatch) {
        text = jsonMatch[0];
      } else {
        text = '{}';
      }
      const data = JSON.parse(text);
      return data.status ? data : { status: "success", ...data };
    } catch (error) {
      console.error('Fetch error:', error);
      return { status: "error", message: error.message };
    }
  };

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
    try {
      const data = await fetchOffersData(offersUrl);
      if (Array.isArray(data) && data.length > 0) {
        setOffers(data);
        setActiveOfferId(data[0]?.id || null);
      } else {
        setOffers([]);
        setActiveOfferId(null);
        console.log('No offers available, but no alert will be shown to user.');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
      setActiveOfferId(null);
    }
  };

  const fetchCategories = async () => {
    const apiUrl = "https://abdulrahmanantar.com/outbye/categories/categories.php";
    try {
      const data = await fetchWithToken(apiUrl);
      if (data.status === "success" && Array.isArray(data.data)) {
        setCategories(data.data.filter(category => category.is_deleted === "0"));
      } else {
        setCategories([]);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Data',
          text: 'Unable to load categories.',
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching categories.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountItems = async () => {
    const apiUrl = "https://abdulrahmanantar.com/outbye/home.php";
    try {
      const data = await fetchWithTokenForDiscount(apiUrl);
      let itemsData;
      if (Array.isArray(data)) {
        itemsData = data.find(obj => obj.items && obj.items.data);
      } else if (data.items && data.items.data) {
        itemsData = data;
      } else {
        itemsData = null;
      }
      if (itemsData && itemsData.items.status === "success" && Array.isArray(itemsData.items.data)) {
        const discountedItems = itemsData.items.data
          .filter(item => 
            item.items_discount && 
            parseFloat(item.items_discount) > 0 && 
            parseFloat(item.items_discount) < parseFloat(item.items_price) && 
            item.items_is_deleted === "0"
          )
          .slice(0, 10);
        setDiscountItems(discountedItems);
        if (discountedItems.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No Discounts Available',
            text: 'No items with valid discounts found.',
          });
        }
      } else {
        setDiscountItems([]);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Discounts',
          text: 'No discount items available.',
        });
      }
    } catch (error) {
      console.error('Error fetching discount items:', error);
      setDiscountItems([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching discount items.',
      });
    }
  };

  const fetchTopSelling = async () => {
    const topSellingUrl = "https://abdulrahmanantar.com/outbye/topselling.php";
    try {
      const data = await fetchWithToken(topSellingUrl);
      if (data.status === "success" && Array.isArray(data.items.data)) {
        setTopSellingItems(data.items.data.slice(0, 10));
      } else {
        setTopSellingItems([]);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Top Selling',
          text: 'No top selling items available.',
        });
      }
    } catch (error) {
      console.error('Error fetching top selling data:', error);
      setTopSellingItems([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching top selling items.',
      });
    }
  };

  const handleAddToCart = async (itemId, type = 'item') => {
    console.log('Button clicked, Item ID:', itemId, 'Type:', type);
    if (!itemId) {
      console.error('Error: Item ID is undefined or null');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid item ID. Please try again.',
      });
      return;
    }

    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Error",
        text: "Please log in first to add the item to the cart.",
        confirmButtonText: "Log In",
        showCancelButton: true,
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
      return;
    }

    console.log('Adding to cart: Item ID', itemId, 'Type:', type);
    try {
      await dispatch(addToCart({ userId, itemId: String(itemId), quantity: 1, type })).unwrap();
      Swal.fire({
        icon: "success",
        title: "✅ Added!",
        text: `${type === 'offer' ? 'Offer' : 'Item'} added to cart successfully.`,
        confirmButtonText: "OK"
      });
      dispatch(fetchCart(userId));
    } catch (error) {
      console.error('Error adding to cart:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to add ${type === 'offer' ? 'offer' : 'item'} to cart: ${error}`,
        confirmButtonText: "OK"
      });
    }
  };

  const handleToggleFavorite = async (itemId) => {
    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Error",
        text: "Please log in first to add items to favorites.",
        confirmButtonText: "Log In",
        showCancelButton: true,
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
      return;
    }

    const isFavorited = favorites.some(fav => String(fav.favorite_itemsid) === String(itemId));

    try {
      await dispatch(toggleFavorite({ userId, itemId, isFavorited })).unwrap();
      Swal.fire({
        icon: "success",
        title: isFavorited ? "✅ Removed!" : "✅ Added!",
        text: isFavorited ? "Item removed from favorites successfully." : "Item added to favorites successfully.",
        confirmButtonText: "OK"
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${isFavorited ? 'remove' : 'add'} item: ${error}`,
      });
    }
  };

  const handleStarClick = (index) => setRating(index + 1);

  const submitFeedback = async () => {
    if (rating === 0) {
      Swal.fire({ icon: 'error', text: 'Please provide a rating before submitting.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire({ icon: 'error', text: 'No authentication token found. Please log in again.' });
        return;
      }

      const formData = new URLSearchParams({
        user_id: userId,
        rating,
        comment,
        service_type: serviceType || '',
      });

      const response = await fetch('https://abdulrahmanantar.com/outbye/user_review/add_review.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Swal.fire({ icon: 'error', text: 'Please log in again.' });
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { success: false, message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }

      if (data.success) {
        Swal.fire({ icon: 'success', text: data.message });
        setRating(0);
        setComment('');
        setServiceType('');
        setShowFeedbackFields(false);
      } else {
        Swal.fire({ icon: 'error', text: data.message || 'Failed to submit review' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', text: 'An error occurred while submitting the review' });
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDiscountItems();
    fetchTopSelling();
    fetchOffers();

    if (userId) {
      dispatch(fetchFavorites(userId));
      dispatch(fetchCart(userId));
    }

    let discountObserver;
    let topSellingObserver;

    if (discountRef.current) {
      discountObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            discountObserver.unobserve(discountRef.current);
          }
        },
        { threshold: 0.1 }
      );
      discountObserver.observe(discountRef.current);
    }

    if (topSellingRef.current) {
      topSellingObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            topSellingObserver.unobserve(topSellingRef.current);
          }
        },
        { threshold: 0.1 }
      );
      topSellingObserver.observe(topSellingRef.current);
    }

    return () => {
      if (discountRef.current && discountObserver) {
        discountObserver.unobserve(discountRef.current);
      }
      if (topSellingRef.current && topSellingObserver) {
        topSellingObserver.unobserve(topSellingRef.current);
      }
    };
  }, [dispatch, userId]);

  useEffect(() => {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.offers-carousel-item');
    const dots = document.querySelectorAll('.offer-card-dot');

    const showSlide = (index) => {
      if (slides.length > 0 && dots.length > 0 && index < slides.length && index < dots.length) {
        slides.forEach((slide, i) => {
          slide.classList.remove('active');
          if (dots[i]) dots[i].classList.remove('active');
        });
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        const activeOffer = offers.length > 4 && index === 4 ? null : offers[index];
        setActiveOfferId(activeOffer?.id || null);
        console.log('Active Offer ID updated:', activeOffer?.id || 'None');
      }
    };

    const nextSlide = () => {
      if (slides.length > 0) {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
      }
    };

    const handleDotClick = (index) => {
      currentSlide = index;
      showSlide(index);
    };

    dots.forEach((dot, index) => {
      dot.removeEventListener('click', () => handleDotClick(index));
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => handleDotClick(index));
    });

    if (slides.length > 0 && dots.length > 0) {
      showSlide(currentSlide);
      const interval = setInterval(nextSlide, 10000);

      return () => {
        clearInterval(interval);
        dots.forEach((dot, index) => {
          dot.removeEventListener('click', () => handleDotClick(index));
        });
      };
    }
  }, [offers]);

  useEffect(() => {
    if (discountItems.length > 0) {
      const discountGlide = new Glide('.discount-glide', {
        type: 'carousel',
        perView: 4,
        gap: 20,
        autoplay: false,
        breakpoints: {
          1024: { perView: 3 },
          768: { perView: 2 },
          480: { perView: 1 }
        }
      });

      discountGlide.mount();

      return () => {
        discountGlide.destroy();
      };
    }
  }, [discountItems]);

  useEffect(() => {
    if (topSellingItems.length > 0) {
      const topSellingGlide = new Glide('.top-selling-glide', {
        type: 'carousel',
        perView: 4,
        gap: 10,
        autoplay: false,
        breakpoints: {
          1024: { perView: 3 },
          768: { perView: 2 },
          480: { perView: 1 }
        }
      });

      topSellingGlide.mount();

      return () => {
        topSellingGlide.destroy();
      };
    }
  }, [topSellingItems]);

  return (
    <>
      <Banner />

      <div className="container">
        <h2 className="title">Categories</h2>
        <div className="categories">
          <div className="category-items-wrapper" id="category-items">
            {loading ? (
              <p>Loading categories...</p>
            ) : categories.length > 0 ? (
              categories.map(category => (
                <div className="category-item" key={category.categories_id}>
                  <Link to={`/services/${category.categories_id}`} className="category-link">
                    <div className="category-box">
                      <img
                        src={category.categories_image || 'images/out bye.png'}
                        alt={category.categories_name}
                        className="category-image"
                        onError={(e) => (e.target.src = 'images/out bye.png')}
                      />
                      <div className="category-description">
                        <p className="category-name">{category.categories_name || 'Unnamed Category'}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p>No categories available.</p>
            )}
          </div>
        </div>
      </div>

      {offers.length > 0 && (
        <section className="offers-section">
          <h2 className="section-title">Special Offers</h2>
          <div className="offers-carousel">
            {offers.slice(0, 4).map((offer, index) => (
              <div
                className={`offers-carousel-item ${index === 0 ? 'active' : ''}`}
                key={offer.id || `offer-${index}`}
              >
                <div className="offer-card">
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
                          onClick={() => {
                            console.log('Offer Add to Cart button clicked, Offer ID:', offer.id);
                            handleAddToCart(offer.id, 'offer');
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {offers.length > 4 && (
              <div
                className={`offers-carousel-item`}
                key="out-buy-card"
              >
                <div className="offer-card">
                  <div className="offer-image-wrapper">
                    <img
                      src="images/out bye.png"
                      alt="Out Buy"
                      loading="lazy"
                    />
                  </div>
                  <div className="offer-details out-buy-details">
                    <h3>More Offers Available!</h3>
                    <p className="offer-description">Check out all our amazing offers.</p>
                    <Link to="/all-offers" className="view-all-offers-btn">
                      View All Offers
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <div className="offer-card-dots">
              {[...Array(Math.min(offers.length, 4) + (offers.length > 4 ? 1 : 0))].map((_, index) => (
                <span
                  key={index}
                  className={`offer-card-dot ${index === 0 ? 'active' : ''}`}
                ></span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="discount-section" ref={discountRef}>
        <h2 className="section-title">Our Discount</h2>
        {discountItems.length > 0 ? (
          <div className="glide discount-glide">
            <div className="glide__track" data-glide-el="track">
              <div className="glide__slides">
                {discountItems.map(item => {
                  const isFavorited = favorites.some(fav => String(fav.favorite_itemsid) === String(item.items_id));
                  const discountedPrice = parseFloat(item.items_price) - parseFloat(item.items_discount || 0);
                  return (
                    <div className="glide__slide" key={item.items_id}>
                      <div className="card-content">
                        <h5 className="service-name">{item.service_name || 'Unknown Service'}</h5>
                        <div className="image-container">
                          <img
                            src={item.items_image || 'images/out bye.png'}
                            alt={item.items_name}
                            className="card-image"
                            onError={(e) => (e.target.src = 'images/out bye.png')}
                            loading="lazy"
                          />
                        </div>
                        <h3 className="card-title">{item.items_name || 'Unnamed Item'}</h3>
                        <p className="card-description">{item.items_des || 'No description available.'}</p>
                        <p className="price">
                          <span className="old-price">{item.items_price || '0'} EGP</span>
                          <span className="new-price">{discountedPrice.toFixed(2)} EGP</span>
                        </p>
                        <div className="card-actions">
                          <button className="addItem-to-cart" onClick={() => handleAddToCart(item.items_id, 'item')}>
                            Add to Cart
                          </button>
                          <button
                            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                            onClick={() => handleToggleFavorite(item.items_id)}
                          >
                            <i className={isFavorited ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="glide__arrows" data-glide-el="controls">
              <button className="glide__arrow glide__arrow--left" data-glide-dir="<">prev</button>
              <button className="glide__arrow glide__arrow--right" data-glide-dir=">">next</button>
            </div>
          </div>
        ) : (
          <p>No discounted items available.</p>
        )}
      </section>

      <section className="top-selling-section" ref={topSellingRef}>
        <h2 className="section-title">Top Selling</h2>
        {topSellingItems.length > 0 ? (
          <div className="glide top-selling-glide">
            <div className="glide__track" data-glide-el="track">
              <div className="glide__slides">
                {topSellingItems.map(item => {
                  const isFavorited = favorites.some(fav => String(fav.favorite_itemsid) === String(item.items_id));
                  return (
                    <div className="glide__slide" key={item.items_id}>
                      <div className="card-content">
                        <div className="image-container">
                          <img
                            src={item.items_image || 'images/out bye.png'}
                            alt={item.items_name}
                            className="card-image"
                            onError={(e) => (e.target.src = 'images/out bye.png')}
                            loading="lazy"
                          />
                        </div>
                        <h3 className="card-title">{item.items_name || 'Unnamed Item'}</h3>
                        <p className="card-description">{item.items_des || 'No description available.'}</p>
                        <p className="price">
                          {item.items_discount && parseFloat(item.items_discount) > 0 ? (
                            <>
                              <span className="old-price text-muted text-decoration-line-through">{item.items_price || '0'} EGP</span>
                              <span className="new-price text-success">{item.items_discount || '0'} EGP</span>
                            </>
                          ) : (
                            <span className="regular-price">{item.items_price || '0'} EGP</span>
                          )}
                        </p>
                        <div className="card-actions">
                          <button className="addItem-to-cart" onClick={() => handleAddToCart(item.items_id, 'item')}>
                            Add to Cart
                          </button>
                          <button
                            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                            onClick={() => handleToggleFavorite(item.items_id)}
                          >
                            <i className={isFavorited ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="glide__arrows" data-glide-el="controls">
              <button className="glide__arrow glide__arrow--left" data-glide-dir="<">prev</button>
              <button className="glide__arrow glide__arrow--right" data-glide-dir=">">next</button>
            </div>
          </div>
        ) : (
          <p>No top selling items available.</p>
        )}
      </section>

      {userId && (
        <section className="feedback-section">
          <h2 className="section-title">
            <i className="fas fa-star feedback-icon star-pulse"></i> Share Your Feedback
          </h2>
          <div className="feedback-container review-card">
            <p className="feedback-instruction">Please rate your experience</p>
            <div className="stars">
              {[...Array(5)].map((_, index) => (
                <i
                  key={index}
                  className={`fas fa-star ${index < rating ? 'active' : ''} cursor-pointer star-icon`}
                  onClick={() => handleStarClick(index)}
                />
              ))}
            </div>
            {showFeedbackFields ? (
              <div className="feedback-fields">
                <input
                  type="text"
                  placeholder="Service Type (Optional)"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="feedback-input"
                />
                <textarea
                  placeholder="Write your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                  className="feedback-textarea"
                />
                <button onClick={submitFeedback} className="submit-btn">
                  <i className="fas fa-check-circle btn-icon"></i> Submit Feedback
                </button>
              </div>
            ) : (
              <button onClick={() => setShowFeedbackFields(true)} className="add-comment-btn">
                <i className="fas fa-comment-dots btn-icon"></i> Add Comment
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default Home;