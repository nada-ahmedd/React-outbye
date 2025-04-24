import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Services.css';

const Services = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState('');
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

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
    const apiUrl = `https://abdulrahmanantar.com/outbye/services/services.php?id=${id}`;
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
      console.error('Error fetching services:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching services.',
      });
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchServiceItems = async (serviceId) => {
    const apiUrl = "https://abdulrahmanantar.com/outbye/items/items.php";
    try {
      const data = await fetchWithToken(apiUrl, {
        method: "POST",
        body: new URLSearchParams({ id: serviceId }).toString()
      });
      if (data.status === "success" && data.data && data.data.length > 0) {
        navigate(`/items/${serviceId}`, { state: { fromService: true } });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Items',
          text: 'No items found for this service.',
        });
      }
    } catch (error) {
      console.error('Error fetching service items:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching items.',
      });
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

  return (
    <main>
      {/* Category Header */}
      <div id="category-container">
        {categoryName ? (
          <div className="category-header">
            <h2>{categoryName}</h2>
          </div>
        ) : (
          <p>Loading category...</p>
        )}
      </div>

      {/* Services Container */}
      <div id="services-container">
        {servicesLoading ? (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
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
                onError={(e) => (e.target.src = 'images/out bye.png')}
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
                      {service.service_website}
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