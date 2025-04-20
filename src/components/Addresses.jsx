import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import '../styles/Addresses.css';

// All imports are at the top level

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  VIEW: `${API_BASE_URL}address/view.php`,
  ADD: `${API_BASE_URL}address/addweb.php`,
  EDIT: `${API_BASE_URL}address/editweb.php`,
  DELETE: `${API_BASE_URL}address/delet.php`,
};

const Addresses = () => {
  const navigate = useNavigate();
  const { userId, isLoggedIn } = useSelector((state) => state.auth);
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    addressName: '',
    addressCity: '',
    addressStreet: '',
    addressPhone: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: 'You must log in first.',
        confirmButtonText: 'Log In',
      }).then(() => {
        navigate('/signin');
      });
      return;
    }
    loadAddresses();
  }, [isLoggedIn, userId, navigate]);

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      await Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: 'No authentication token found. Please log in again.',
      });
      navigate('/signin');
      return null;
    }

    try {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          await Swal.fire({
            icon: 'warning',
            title: 'Error',
            text: 'Unauthorized. Please log in again.',
          });
          navigate('/signin');
          return null;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      return text.trim() ? JSON.parse(text) : { status: 'success' };
    } catch (error) {
      throw error;
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await fetchWithToken(ENDPOINTS.VIEW, {
        method: 'POST',
        body: new URLSearchParams({ usersid: userId }).toString(),
      });
      if (data === null) {
        return;
      }
      if (data.status === 'success' && Array.isArray(data.data)) {
        setAddresses(data.data);
        localStorage.setItem('userAddresses', JSON.stringify(data.data));
      } else {
        setAddresses([]);
        localStorage.setItem('userAddresses', JSON.stringify([]));
      }
    } catch (error) {
      setAddresses([]);
      localStorage.setItem('userAddresses', JSON.stringify([]));
      Swal.fire('error', 'Error', 'Failed to load addresses: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const addAddress = async () => {
    const { addressName, addressCity, addressStreet, addressPhone } = formData;
    if (!addressName || !addressCity || !addressStreet || !addressPhone) {
      Swal.fire('warning', 'Error', 'Please fill in all fields.');
      return;
    }

    try {
      const result = await fetchWithToken(ENDPOINTS.ADD, {
        method: 'POST',
        body: new URLSearchParams({
          usersid: userId,
          name: addressName,
          city: addressCity,
          street: addressStreet,
          phone: addressPhone,
        }).toString(),
      });
      if (result === null) return;
      await loadAddresses();
      Swal.fire('success', 'Success', 'Address added successfully.');
      resetForm();
    } catch (error) {
      Swal.fire('error', 'Error', 'Failed to add address: ' + error.message);
    }
  };

  const editAddressForm = (address) => {
    setFormData({
      addressName: address.address_name,
      addressCity: address.address_city,
      addressStreet: address.address_street,
      addressPhone: address.address_phone,
    });
    setEditMode(true);
    setEditAddressId(address.address_id);
  };

  const saveEdit = async () => {
    const { addressName, addressCity, addressStreet, addressPhone } = formData;
    if (!addressName || !addressCity || !addressStreet || !addressPhone) {
      Swal.fire('warning', 'Error', 'Please fill in all fields.');
      return;
    }

    try {
      const result = await fetchWithToken(ENDPOINTS.EDIT, {
        method: 'POST',
        body: new URLSearchParams({
          addressid: editAddressId,
          name: addressName,
          city: addressCity,
          street: addressStreet,
          phone: addressPhone,
        }).toString(),
      });
      if (result === null) return;
      await loadAddresses();
      Swal.fire('success', 'Success', 'Address updated successfully.');
      resetForm();
    } catch (error) {
      Swal.fire('error', 'Error', 'Failed to update address: ' + error.message);
    }
  };

  const deleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this address?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#F26B0A',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      const result = await fetchWithToken(ENDPOINTS.DELETE, {
        method: 'POST',
        body: new URLSearchParams({ addressid: addressId }).toString(),
      });
      if (result === null) return;
      await loadAddresses();
      Swal.fire('success', 'Success', 'Address deleted successfully.');
    } catch (error) {
      Swal.fire('error', 'Error', 'Failed to delete address: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      addressName: '',
      addressCity: '',
      addressStreet: '',
      addressPhone: '',
    });
    setEditMode(false);
    setEditAddressId(null);
  };

  const goToCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div>
      <h1>Manage Your Addresses</h1>
      <div className="container-wrapper">
        <div className="content-wrapper">
          <div className="address-form-container">
            <h3>{editMode ? 'Edit Address' : 'Add New Address'}</h3>
            <div className="address-form">
              <div className="form-group">
                <i className="fas fa-home"></i>
                <input
                  type="text"
                  id="addressName"
                  placeholder="Address Name"
                  value={formData.addressName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <i className="fas fa-city"></i>
                <input
                  type="text"
                  id="addressCity"
                  placeholder="City"
                  value={formData.addressCity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <i className="fas fa-road"></i>
                <input
                  type="text"
                  id="addressStreet"
                  placeholder="Street"
                  value={formData.addressStreet}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <i className="fas fa-phone"></i>
                <input
                  type="text"
                  id="addressPhone"
                  placeholder="Phone"
                  value={formData.addressPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-buttons">
                {editMode ? (
                  <button onClick={saveEdit}>Save Changes</button>
                ) : (
                  <button onClick={addAddress}>Add Address</button>
                )}
                <button className="clear-btn" onClick={resetForm}>Clear Form</button>
              </div>
            </div>
          </div>
          <div className="address-list-container">
            <h3>Your Saved Addresses</h3>
            <div className="address-list">
              {addresses.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No saved addresses.</p>
              ) : (
                addresses.map((address) => (
                  <div key={address.address_id} className="address-item" data-address-id={address.address_id}>
                    <span>
                      <i className="fas fa-map-marker-alt"></i>{' '}
                      {`${address.address_name}, ${address.address_city}, ${address.address_street}, ${address.address_phone}`}
                    </span>
                    <div className="actions">
                      <button className="edit-btn" onClick={() => editAddressForm(address)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="delete-btn" onClick={() => deleteAddress(address.address_id)}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="checkout-button" onClick={goToCheckout}>
              Go to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export at the top level
export default Addresses;