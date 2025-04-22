import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import Footer from './Footer';
import { loginUser, fetchUserProfile, checkEmail, resetPassword } from '../store/authSlice';
import '../styles/SignIn.css';

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, resetEmail } = useSelector((state) => state.auth);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (location.search.includes('reset=true') && resetEmail) {
      setShowResetModal(true);
    }
  }, [location, resetEmail]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
      });
      dispatch({ type: 'auth/clearError' });
    }
  }, [error, dispatch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrPhone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email.',
      });
      return;
    }

    const credentials = { email: emailOrPhone, password };
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      const userId = result.payload.user_id;
      await dispatch(fetchUserProfile(userId));
      Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting to your profile...',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/profile');
      });
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault(); // منع السلوك الافتراضي للـ <a>
    setShowForgotModal(true);
  };

  const handleCheckEmail = async () => {
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email.',
      });
      return;
    }
    const result = await dispatch(checkEmail(forgotEmail));
    if (checkEmail.fulfilled.match(result)) {
      setShowForgotModal(false);
      navigate('/verify-forget-password');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match.',
      });
      return;
    }

    const result = await dispatch(resetPassword({ email: resetEmail, password: newPassword }));
    if (resetPassword.fulfilled.match(result)) {
      setShowResetModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Password reset successfully',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/signin');
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid signin-page">
        <div className="row signin-container">
          <div className="col-md-6 p-0">
            <img src="/images/sign.jpg" alt="Login Image" className="w-100 m-1 signin-image" />
          </div>
          <div className="col-md-6">
            <div className="sign-in-form">
              <h2>Log in to Exclusive</h2>
              <p className="text-muted">Enter your details below</p>
              <form id="loginForm" onSubmit={handleLogin}>
                <div className="mb-3">
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Email Address"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="button-container">
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Log In'}
                  </button>
                  <div className="forgot-password">
                    <a href="#" onClick={handleForgotPassword}>
                      Forgot Password?
                    </a>
                  </div>
                </div>
              </form>
              <div className="signup-link" style={{ marginTop: '15px' }}>
                <p>
                  Don't have an account?{' '}
                  <Link to="/signup" className="signup-link-a">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>

            {/* Forgot Password Modal */}
            <div className="modal" style={{ display: showForgotModal ? 'flex' : 'none' }}>
              <div className="modal-content">
                <button
                  className="close-modal"
                  onClick={() => setShowForgotModal(false)}
                >
                  ×
                </button>
                <h3>Reset Password</h3>
                <input
                  type="email"
                  id="forgotEmail"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <button className="modal-submit" onClick={handleCheckEmail} disabled={loading}>
                  {loading ? 'Processing...' : 'Submit'}
                </button>
                <button
                  className="back-btn"
                  onClick={() => setShowForgotModal(false)}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Reset Password Modal */}
            <div className="modal" style={{ display: showResetModal ? 'flex' : 'none' }}>
              <div className="modal-content">
                <button
                  className="close-modal"
                  onClick={() => setShowResetModal(false)}
                >
                  ×
                </button>
                <h3>Reset Your Password</h3>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button className="modal-submit" onClick={handleResetPassword} disabled={loading}>
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
                <button
                  className="back-btn"
                  onClick={() => setShowResetModal(false)}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignIn;