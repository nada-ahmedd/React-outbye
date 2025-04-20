import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { setProfile, setLoading, setError } from '../store/authSlice';
import { Spinner } from 'spin.js';
import '../styles/Profile.css';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, isAdminLoggedIn, profile } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [imageLoading, setImageLoading] = useState(false);
  const spinnerContainerRef = useRef(null);

  const API_BASE_URL = 'https://abdulrahmanantar.com/outbye/';
  const ENDPOINTS = {
    VIEW: `${API_BASE_URL}profile/view.php`,
    EDIT: `${API_BASE_URL}profile/edit_profile.php`,
    REMOVE_IMAGE: `${API_BASE_URL}profile/remove.php`,
  };

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(setError('No token found'));
      return { status: 'error', message: 'No token found' };
    }

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    if (!(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      if (typeof options.body === 'object' && !(options.body instanceof URLSearchParams)) {
        options.body = new URLSearchParams(options.body).toString();
      }
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      console.log("Raw API Response:", text);

      let data = { status: 'success' };
      const jsonMatch = text.match(/{.*}/s);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn("Failed to parse JSON, assuming success:", parseError.message);
        }
      } else {
        console.warn("No JSON found in response, assuming success:", text);
      }
      return data;
    } catch (error) {
      dispatch(setError(error.message));
      return { status: 'error', message: error.message };
    }
  };

  const loadProfile = async () => {
    if (!isLoggedIn && !isAdminLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: 'Please log in to view your profile',
      }).then(() => navigate('/signin'));
      return;
    }

    dispatch(setLoading(true));
    setImageLoading(true);
    let spinner;
    if (spinnerContainerRef.current) {
      spinner = new Spinner({ color: '#F26B0A', lines: 12 }).spin(spinnerContainerRef.current);
    }

    const userId = localStorage.getItem('userId');
    const data = await fetchWithToken(ENDPOINTS.VIEW, {
      method: 'POST',
      body: { users_id: userId },
    });

    if (data.status === 'success') {
      dispatch(setProfile(data.data || {}));
      localStorage.setItem('profileData', JSON.stringify(data.data));
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to load profile' });
    }

    if (spinner) spinner.stop();
    setImageLoading(false);
    dispatch(setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [isLoggedIn, isAdminLoggedIn]);

  const showEditForm = () => {
    setEditForm({
      name: profile?.users_name || '',
      email: profile?.users_email || '',
      phone: profile?.users_phone || '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const editProfile = async () => {
    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    formData.append('users_id', userId);

    if (editForm.name && editForm.name !== profile?.users_name) {
      formData.append('new_name', editForm.name);
    }
    if (editForm.email && editForm.email !== profile?.users_email) {
      formData.append('new_email', editForm.email);
    }
    if (editForm.phone && editForm.phone !== profile?.users_phone) {
      formData.append('new_phone', editForm.phone);
    }

    const entries = [...formData.entries()];
    if (entries.length <= 1) {
      Swal.fire({ icon: 'info', title: 'Info', text: 'No changes to save' });
      setIsEditing(false);
      return;
    }

    const response = await fetchWithToken(ENDPOINTS.EDIT, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 'success') {
      await loadProfile();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Profile updated successfully' });
      setIsEditing(false);
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to update profile' });
    }
  };

  const validateImage = (file) => {
    const allowedFormats = ['jpg', 'jpeg', 'png', 'gif'];
    const maxSize = 5 * 1024 * 1024;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedFormats.includes(fileExtension)) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Invalid image format. Allowed formats: ${allowedFormats.join(', ')}.` });
      return false;
    }

    if (file.size > maxSize) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Image size too large. Max size is 5MB.' });
      return false;
    }

    return true;
  };

  const uploadProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !validateImage(file)) return;

    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    formData.append('users_id', userId);
    formData.append('image', file);

    setImageLoading(true);
    let spinner;
    if (spinnerContainerRef.current) {
      spinner = new Spinner({ color: '#F26B0A', lines: 12 }).spin(spinnerContainerRef.current);
    }

    const response = await fetchWithToken(ENDPOINTS.EDIT, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 'success') {
      await loadProfile();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Image uploaded successfully' });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to upload image' });
    }

    if (spinner) spinner.stop();
    setImageLoading(false);
  };

  const removeProfileImage = async () => {
    const userId = localStorage.getItem('userId');
    const response = await fetchWithToken(ENDPOINTS.REMOVE_IMAGE, {
      method: 'POST',
      body: { users_id: userId },
    });

    if (response.status === 'success') {
      const updatedProfile = { ...profile, users_image: '' };
      dispatch(setProfile(updatedProfile));
      localStorage.setItem('profileData', JSON.stringify(updatedProfile));
      Swal.fire({ icon: 'success', title: 'Success', text: 'Profile image removed successfully' });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to remove image' });
    }
  };

  if (!isLoggedIn && !isAdminLoggedIn) {
    return null;
  }

  return (
    <div className="main-content">
      {/* Profile View Section */}
      <div className="profile-card" style={{ display: isEditing ? 'none' : 'block' }}>
        <div className="profile-image-container">
          <div
            className="spinner-container"
            ref={spinnerContainerRef}
            style={{ display: imageLoading ? 'flex' : 'none' }}
          ></div>
          <img
            src={profile?.users_image ? `${profile.users_image}?t=${Date.now()}` : ''}
            alt="Profile Image"
            className={`profile-avatar ${profile?.users_image && !imageLoading ? 'active' : ''}`}
            style={{ display: profile?.users_image && !imageLoading ? 'block' : 'none' }}
          />
          <i
            className={`fas fa-user-circle ${!profile?.users_image && !imageLoading ? 'active' : ''}`}
            id="default-avatar"
            style={{ display: !profile?.users_image && !imageLoading ? 'block' : 'none' }}
          ></i>
          <div className="image-actions">
            <button className="image-action-btn upload-btn" onClick={() => document.getElementById('edit-image')?.click()}>
              <i className="fas fa-upload"></i>
            </button>
            <button
              className="image-action-btn remove"
              onClick={removeProfileImage}
              style={{ display: profile?.users_image && !imageLoading ? 'flex' : 'none' }}
            >
              <i className="fas fa-trash"></i>
            </button>
            <input
              type="file"
              id="edit-image"
              style={{ display: 'none' }}
              accept=".jpg,.jpeg,.png,.gif"
              onChange={uploadProfileImage}
            />
          </div>
        </div>
        <div className="profile-content">
          <div className="profile-item">
            <span>{profile?.users_name || 'Not provided'}</span>
          </div>
          <div className="profile-item">
            <span>{profile?.users_email || 'Not provided'}</span>
          </div>
          <div className="profile-item">
            <span>{profile?.users_phone || 'Not provided'}</span>
          </div>
          <div className="profile-item">
            <span>{profile?.users_create || 'Not provided'}</span>
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn" onClick={showEditForm}>Edit Profile</button>
          <button className="btn" onClick={() => navigate('/favorites')}>Favorites</button>
          <button className="btn" onClick={() => navigate('/cart')}>Cart</button>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="edit-container" style={{ display: isEditing ? 'block' : 'none' }}>
        <div className="form-group">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={editForm.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={editForm.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={editForm.phone}
            onChange={handleInputChange}
          />
        </div>
        <div className="action-buttons">
          <button className="btn" onClick={editProfile}>Save Changes</button>
          <button className="btn" onClick={cancelEdit}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;