import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite, fetchFavorites } from '../store/favoritesSlice';
import { fetchCart, addToCart } from '../store/cartSlice';
import Swal from 'sweetalert2';
import Glide from '@glidejs/glide';
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
  const [loading, setLoading] = useState(true);
  const discountRef = useRef(null);
  const topSellingRef = useRef(null);

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

  const fetchCategories = async () => {
    const apiUrl = "https://abdulrahmanantar.com/outbye/home.php";
    try {
      const data = await fetchWithToken(apiUrl);
      if (data.status === "success" && data.categories && Array.isArray(data.categories.data)) {
        setCategories(data.categories.data);
        const discountedItems = data.items.data.filter(item => item.items_discount).slice(0, 10);
        setDiscountItems(discountedItems);
      } else {
        setCategories([]);
        setDiscountItems([]);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Data',
          text: 'Unable to load categories or discount items.',
        });
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopSelling = async () => {
    const topSellingUrl = "https://abdulrahmanantar.com/outbye/topselling.php";
    try {
      const data = await fetchWithToken(topSellingUrl);
      if (data.status === "success" && data.items && Array.isArray(data.items.data)) {
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching top selling items.',
      });
    }
  };

  const handleAddToCart = async (itemId) => {
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

    try {
      await dispatch(addToCart({ userId, itemId, quantity: 1 })).unwrap();
      Swal.fire({
        icon: "success",
        title: "✅ Added!",
        text: "Item added to cart successfully.",
        confirmButtonText: "OK"
      });
      dispatch(fetchCart(userId));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to add item to cart: ${error}`,
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

  useEffect(() => {
    fetchCategories();
    fetchTopSelling();

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
    const slides = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.dot');

    const showSlide = (index) => {
      if (slides.length > 0 && dots.length > 0) {
        slides.forEach((slide, i) => {
          slide.classList.remove('active');
          dots[i].classList.remove('active');
        });
        slides[index].classList.add('active');
        dots[index].classList.add('active');
      }
    };

    const nextSlide = () => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });

    showSlide(currentSlide);
    const interval = setInterval(nextSlide, 3000);

    return () => clearInterval(interval);
  }, []);

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
      <section className="banner">
        <div className="carousel">
          <div className="carousel-item active">
            <img src="images/pexels-photo-260922.webp" alt="Slide 1" />
            <div className="carousel-overlay"></div>
          </div>
          <div className="carousel-item">
            <img src="images/lanscape-empty-restaurant.jpg" alt="Slide 2" />
            <div className="carousel-overlay"></div>
          </div>
          <div className="carousel-item">
            <img src="images/pexels-photo-338504.jpeg" alt="Slide 3" />
            <div className="carousel-overlay"></div>
          </div>
        </div>
        <div className="dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        <div className="banner-text">Welcome to <span>OutBye</span></div>
      </section>

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
                        src={category.categories_image || 'public/images/out bye.png'}
                        alt={category.categories_name}
                        className="category-image"
                        onError={(e) => (e.target.src = 'public/images/out bye.png')}
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

      <section className="discount-section" ref={discountRef}>
        <h2 className="section-title">Our Discount</h2>
        {discountItems.length > 0 ? (
          <div className="glide discount-glide">
            <div className="glide__track" data-glide-el="track">
              <div className="glide__slides">
                {discountItems.map(item => {
                  const isFavorited = favorites.some(fav => String(fav.favorite_itemsid) === String(item.items_id));
                  return (
                    <div className="glide__slide" key={item.items_id}>
                      <div className="card-content">
                        <h5 className="service-name">{item.service_name || 'Unknown Service'}</h5>
                        <div className="image-container">
                          <img
                            src={item.items_image || 'public/images/out bye.png'}
                            alt={item.items_name}
                            className="card-image"
                            onError={(e) => (e.target.src = 'public/images/out bye.png')}
                          />
                        </div>
                        <h3 className="card-title">{item.items_name || 'Unnamed Item'}</h3>
                        <p className="card-description">{item.items_des || 'No description available.'}</p>
                        <p className="price">
                          <span className="old-price">{item.items_price || '0'} EGP</span>
                          <span className="new-price">{item.items_discount || '0'} EGP</span>
                        </p>
                        <div className="card-actions">
                          <button className="addItem-to-cart" onClick={() => handleAddToCart(item.items_id)}>
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
                            src={item.items_image || 'public/images/out bye.png'}
                            alt={item.items_name}
                            className="card-image"
                            onError={(e) => (e.target.src = 'public/images/out bye.png')}
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
                          <button className="addItem-to-cart" onClick={() => handleAddToCart(item.items_id)}>
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
    </>
  );
};

export default Home;