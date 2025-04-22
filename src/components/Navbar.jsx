import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { logout, setProfile, setLoading, setError } from '../store/authSlice';
import { fetchSearchResults, setQuery, clearResults, setResultsVisible } from '../store/searchSlice';
import { fetchCart } from '../store/cartSlice';
import '../styles/Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, isAdminLoggedIn, profile } = useSelector((state) => state.auth);
  const { query, items, services, loading, error, isResultsVisible } = useSelector((state) => state.search);
  const cart = useSelector((state) => state.cart || { items: {} });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Session Ended',
        text: 'Your session has ended. Please log in again.',
        confirmButtonText: 'Login',
        confirmButtonColor: '#F26B0A',
        backdrop: `rgba(0,0,0,0.8)`,
        customClass: {
          popup: 'sweet-alert-custom',
          title: 'sweet-alert-title',
          content: 'sweet-alert-content',
          confirmButton: 'sweet-alert-confirm',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          dispatch(logout());
          navigate('/signin');
        }
      });
      return null;
    }

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await fetch(url, {
        ...options,
        method: options.method || 'POST',
        body: options.body || new URLSearchParams({ users_id: userId }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          await Swal.fire({
            icon: 'warning',
            title: 'Session Ended',
            text: 'Your session has ended. Please log in again.',
            confirmButtonText: 'Login',
            confirmButtonColor: '#F26B0A',
            backdrop: `rgba(0,0,0,0.8)`,
            customClass: {
              popup: 'sweet-alert-custom',
              title: 'sweet-alert-title',
              content: 'sweet-alert-content',
              confirmButton: 'sweet-alert-confirm',
            },
          }).then((result) => {
            if (result.isConfirmed) {
              dispatch(logout());
              navigate('/signin');
            }
          });
          return null;
        }
        dispatch(setError(`HTTP error! Status: ${response.status}`));
        return null;
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {
        dispatch(setError(`Error parsing response: ${e.message}`));
        return null;
      }
    } catch (error) {
      dispatch(setError(`Fetch error: ${error.message}`));
      return null;
    }
  };

  const fetchUserProfile = async () => {
    const profileData = localStorage.getItem('profileData');
    if (profileData) {
      dispatch(setProfile(JSON.parse(profileData)));
      return JSON.parse(profileData);
    }

    dispatch(setLoading(true));
    const data = await fetchWithToken('https://abdulrahmanantar.com/outbye/profile/view.php');
    dispatch(setLoading(false));

    if (data && data.status === 'success' && data.data) {
      localStorage.setItem('profileData', JSON.stringify(data.data));
      dispatch(setProfile(data.data));
      return data.data;
    }
    return null;
  };

  const calculateTotalCount = () => {
    let totalCount = 0;
    if (cart.items && typeof cart.items === 'object') {
      Object.values(cart.items).forEach((category) => {
        if (category.datacart && Array.isArray(category.datacart)) {
          category.datacart.forEach((item) => {
            totalCount += parseInt(item.cart_quantity || 0);
          });
        }
      });
    }
    return totalCount;
  };

  useEffect(() => {
    if (isLoggedIn || isAdminLoggedIn) {
      fetchUserProfile();
      const userId = localStorage.getItem('userId');
      if (userId) {
        dispatch(fetchCart(userId));
      }
    }

    if (!isLoggedIn && !isAdminLoggedIn) {
      localStorage.removeItem('favoritesCache');
      document.querySelectorAll('.favorite-btn').forEach((button) => {
        const icon = button.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-solid');
          icon.classList.add('fa-regular');
          icon.style.color = '';
          delete button.dataset.favid;
        }
      });
    }
  }, [isLoggedIn, isAdminLoggedIn, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        dispatch(setResultsVisible(false));
        dispatch(clearResults());
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutsideDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutsideDropdown);
    return () => document.removeEventListener('click', handleClickOutsideDropdown);
  }, []);

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn && !isAdminLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'You need to log in to view your cart!',
        confirmButtonText: 'Login',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
    } else {
      navigate('/cart');
    }
  };

  const handleFavoritesClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn && !isAdminLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'You need to log in to view your favorites!',
        confirmButtonText: 'Login',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) navigate('/signin');
      });
    } else {
      navigate('/favorites');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'You have been logged out successfully. Redirecting to login page.',
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      navigate('/signin');
    });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    console.log('Dropdown Open:', !isDropdownOpen);
  };

  const handleSearch = () => {
    if (!query.trim()) {
      dispatch(clearResults());
      return;
    }
    dispatch(fetchSearchResults(query));
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    dispatch(setQuery(newQuery));
    if (newQuery.trim()) {
      debounce(() => dispatch(fetchSearchResults(newQuery)), 500)();
    } else {
      dispatch(clearResults());
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleResultClick = (serviceId) => {
    if (serviceId) {
      localStorage.setItem('highlightedService', serviceId);
    }
    dispatch(setResultsVisible(false));
    dispatch(clearResults());
  };

  const userName = profile?.users_name || profile?.email?.split('@')[0] || 'User';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=F26B0A&color=fff`;

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="navbar-container">
        <Link className="navbar-logo" to="/">
          <img src="/images/out bye.png" alt="Out Bye Logo" className="logo-img" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <div className="navbar-content">
            <div className="navbar-links">
              <Link className="nav-link" to="/">
                Home
              </Link>
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
              <Link className="nav-link" to="/about">
                About
              </Link>
              {!(isLoggedIn || isAdminLoggedIn) && (
                <Link id="signupBtn" className="nav-link sign-up-link" to="/signin">
                  <i className="fas fa-sign-in-alt" /> Sign In
                </Link>
              )}
            </div>
          </div>

          <div className="navbar-right">
            <div className="search-container" ref={searchContainerRef}>
              <input
                type="text"
                id="searchQuery"
                placeholder="Search..."
                className="search-input"
                value={query}
                onChange={handleInputChange}
              />
              <button className="search-btn" onClick={handleSearch}>
                Search
              </button>
            </div>
            {(isLoggedIn || isAdminLoggedIn) && profile && (
              <div className="user-welcome">
                <img
                  src={profile.users_image || avatarUrl}
                  alt="User Avatar"
                  className="user-avatar"
                />
                <span id="userName">
                  Welcome, {userName}
                </span>
              </div>
            )}
            {(isLoggedIn || isAdminLoggedIn) && (
              <div className={`dropdown ${isDropdownOpen ? 'show' : ''}`} ref={dropdownRef}>
                <button
                  className="nav-icon dropdown-toggle"
                  onClick={toggleDropdown}
                  aria-expanded={isDropdownOpen}
                >
                  <i className="fas fa-user" />
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/pending-orders">
                      <i className="fas fa-clock" /> Pending Orders
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/addresses">
                      <i className="fas fa-map-marker-alt" /> Addresses
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="fas fa-user" /> Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/archive">
                      <i className="fas fa-archive" /> Archive
                    </Link>
                  </li>
                  <li>
                    <button
                      id="logoutBtn"
                      className="dropdown-item"
                      onClick={handleLogout}
                      style={{ display: isLoggedIn || isAdminLoggedIn ? 'block' : 'none' }}
                    >
                      <i className="fas fa-sign-out-alt" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
            <Link className="nav-icon" to="/favorites" onClick={handleFavoritesClick}>
              <i className="fas fa-heart" />
            </Link>
            <button className="nav-icon cart-icon" id="cartIcon" onClick={handleCartClick}>
              <i className="fas fa-shopping-cart" />
              {calculateTotalCount() > 0 && (
                <span className="cart-count">{calculateTotalCount()}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div id="searchResults" className={`search-results ${isResultsVisible ? 'show' : ''}`}>
        <button
          className="close-btn"
          onClick={() => {
            dispatch(setResultsVisible(false));
            dispatch(clearResults());
          }}
        >
          ×
        </button>
        {loading ? (
          <p style={{ color: 'black' }}>Searching...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <>
            <div className="search-result-column">
              <h3>Items</h3>
              {items.length > 0 ? (
                items.map((item) => (
                  <div className="search-result-item" key={item.items_id}>
                    <Link
                      to={`/item/${item.items_id}?service_id=${item.service_id}`}
                      className="search-result-link"
                      onClick={() => handleResultClick(item.service_id)}
                    >
                      <img
                        src={item.items_image || 'images/out bye.png'}
                        alt={item.items_name || 'Item'}
                        width="50"
                      />
                      <span>{item.items_name || 'Unnamed Item'}</span>
                    </Link>
                  </div>
                ))
              ) : (
                <p>No items match your search.</p>
              )}
            </div>
            <div className="search-result-column">
              <h3>Services</h3>
              {services.length > 0 ? (
                services.map((service) => (
                  <div className="search-result-item" key={service.service_id}>
                    <Link
                      to={`/items/${service.service_id}`}
                      state={{ fromService: true }}
                      className="search-result-link"
                      onClick={() => handleResultClick(service.service_id)}
                    >
                      <img
                        src={service.service_image || 'images/out bye.png'}
                        alt={service.service_name || 'Service'}
                        width="50"
                      />
                      <span>
                        {service.service_name || 'Unnamed Service'} (
                        {service.service_name_ar || 'N/A'})
                      </span>
                    </Link>
                  </div>
                ))
              ) : (
                <p>No services match your search.</p>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;