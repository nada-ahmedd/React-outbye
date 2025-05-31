import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Skeleton from 'react-loading-skeleton'; // استيراد مكتبة Skeleton
import 'react-loading-skeleton/dist/skeleton.css'; // استيراد الـ CSS بتاع المكتبة
import '../styles/Services.css';

const Services = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState('');
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || '0';
    console.log("FetchWithToken - Token used:", token);
    console.log("FetchWithToken - User ID used:", userId);
    const excludedAPIs = ["offers.php", "categories.php", "topselling.php", "services.php", "search.php"];
    const isGuest = userId === "0";
    const isItemsAPI = url.includes("items/items.php");
    const isExcluded = excludedAPIs.some(api => url.includes(api)) || !token || isGuest || isItemsAPI;

    if (token && !isExcluded) {
      const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
      if (tokenExpiresAt && new Date().getTime() > parseInt(tokenExpiresAt)) {
        console.warn('Token expired, logging out...');
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'Your session has expired. Please log in again.',
          confirmButtonText: 'Login',
        }).then(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('tokenExpiresAt');
          navigate('/signin');
        });
        throw new Error('Token Expired');
      }
    }

    options.headers = {
      ...options.headers,
      ...(isExcluded ? {} : { 'Authorization': `Bearer ${token}` }),
      "Content-Type": "application/x-www-form-urlencoded"
    };

    if (isItemsAPI) {
      console.log("FetchWithToken - Forcing removal of Authorization header for items/items.php...");
      delete options.headers['Authorization'];
    }

    console.log("FetchWithToken - Request URL:", url);
    console.log("FetchWithToken - Request Options:", JSON.stringify(options, null, 2));
    try {
      const response = await fetch(url, options);
      console.log("FetchWithToken - Response Status:", response.status);
      console.log("FetchWithToken - Response Headers:", JSON.stringify([...response.headers], null, 2));
      if (response.status === 401) {
        console.log("FetchWithToken - 401 Unauthorized - Session Expired");
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'Please log in again.',
          confirmButtonText: 'Login',
        }).then(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('tokenExpiresAt');
          navigate('/signin');
        });
        throw new Error('Unauthorized');
      }
      if (response.status === 403) {
        const errorText = await response.text();
        console.log("FetchWithToken - 403 Forbidden - Access Denied. Response:", errorText);
        throw new Error('Access Denied - Check backend response: ' + errorText);
      }
      const text = await response.text();
      console.log("FetchWithToken - Response text:", text);
      let data = { status: "success" };
      try {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        if (jsonStart !== -1 && jsonEnd > 0) {
          const jsonText = text.substring(jsonStart, jsonEnd);
          data = JSON.parse(jsonText);
        }
      } catch (e) {
        console.error('FetchWithToken - Error parsing JSON:', e);
      }
      return data;
    } catch (error) {
      console.error(`FetchWithToken - Fetch error for ${url}:`, error);
      throw error;
    }
  };

  const fetchServices = async () => {
    if (!id || isNaN(id)) {
      setServicesLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Invalid Category',
        text: 'Invalid category ID.',
      });
      navigate('/');
      return;
    }

    setServicesLoading(true);
    const userId = localStorage.getItem('userId') || '0';
    const apiUrl = `https://abdulrahmanantar.com/outbye/services/services.php?id=${id}&usersid=${userId}`;
    try {
      const data = await fetchWithToken(apiUrl, { method: "GET" });
      if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
        setCategoryName(data.data[0].categories_name);
        setServices(data.data);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Services',
          text: data.message || 'No services found in this category.',
        });
        setServices([]);
      }
    } catch (error) {
      console.error('fetchServices - Error fetching services:', error);
      if (error.message !== 'Unauthorized' && error.message !== 'Access Denied' && error.message !== 'Token Expired') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while fetching services.',
        });
      }
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchServiceItems = async (serviceId) => {
    const apiUrl = "https://abdulrahmanantar.com/outbye/items/items.php";
    const userId = localStorage.getItem('userId') || '0';
    console.log("fetchServiceItems - Service ID:", serviceId);
    console.log("fetchServiceItems - User ID:", userId);
    try {
      const data = await fetchWithToken(apiUrl, {
        method: "POST",
        body: new URLSearchParams({ id: serviceId, usersid: userId }).toString()
      });
      console.log("fetchServiceItems - Response data:", data);
      if (data.status === "success" && data.data && data.data.length > 0) {
        navigate(`/items/${serviceId}`, { state: { fromService: true } });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Items',
          text: data.message || 'No items found for this service.',
        });
      }
    } catch (error) {
      console.error('fetchServiceItems - Error fetching service items:', error);
      if (error.message.includes('Unauthorized')) {
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: 'Please log in to view items.',
          confirmButtonText: 'Login',
          showCancelButton: true,
          cancelButtonText: 'Continue Browsing',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/signin');
          }
        });
      } else if (error.message.includes('Access Denied')) {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'Unable to fetch items. Please try again later.',
          confirmButtonText: 'OK',
        });
      } else if (error.message !== 'Token Expired') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while fetching items.',
        });
      }
    }
  };

  useEffect(() => {
    fetchServices();
  }, [id]);

  useEffect(() => {
    const servicesObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target.querySelector('.service-image');
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

    document.querySelectorAll('.service-item').forEach(item => servicesObserver.observe(item));

    return () => {
      servicesObserver.disconnect();
    };
  }, [services]);

  // دالة لعرض الـ Skeleton أثناء التحميل
  const renderSkeleton = () => {
    return (
      <div className="service-item">
        <Skeleton height={200} width="100%" className="service-image" />
        <div className="service-content">
          <Skeleton height={30} width="80%" className="service-title" />
          <Skeleton height={20} width="100%" count={2} className="service-description" />
          <div className="service-details">
            <Skeleton height={20} width="60%" />
            <Skeleton height={20} width="40%" />
            <Skeleton height={20} width="60%" />
            <Skeleton height={20} width="80%" />
          </div>
          <div className="service-actions">
            <Skeleton height={40} width={120} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <main>
      <div id="category-container">
        {categoryName ? (
          <div className="category-header">
            <h2>{categoryName}</h2>
          </div>
        ) : (
          <Skeleton height={40} width={200} />
        )}
      </div>

      <div id="services-container">
        {servicesLoading ? (
          // عرض 3 كاردات Skeleton أثناء التحميل
          Array(3).fill().map((_, index) => (
            <div key={index}>
              {renderSkeleton()}
            </div>
          ))
        ) : services.length > 0 ? (
          services.map(service => (
            <div
              className="service-item"
              key={service.service_id}
              onClick={() => fetchServiceItems(service.service_id)}
            >
              <img
                data-src={service.service_image}
                alt={service.service_name}
                className="service-image"
                onError={(e) => (e.target.src = '/images/out bye.png')}
              />
              <div className="service-content">
                <h3 className="service-title">{service.service_name}</h3>
                <p className="service-description">{service.service_description}</p>
                <div className="service-details">
                  <p className="secondary"><strong>Location:</strong> {service.service_location}</p>
                  <div className="rating">
                    <i className="fa fa-star"></i>
                    <span>{service.service_rating}</span>
                  </div>
                  <p className="secondary"><strong>Phone:</strong> {service.service_phone}</p>
                  <p className="secondary">
                    <strong>Website:</strong> 
                    <a href={service.service_website} target="_blank" rel="noopener noreferrer">
                      {service.service_name} {/* بدل الـ URL، استخدمنا service_name */}
                    </a>
                  </p>
                </div>
                <div className="service-actions">
                  <button className="view-items-btn">View Items</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No services found in this category.</p>
        )}
      </div>
    </main>
  );
};

export default Services;