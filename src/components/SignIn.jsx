import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const handleForgotPassword = () => {
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

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch('https://abdulrahmanantar.com/outbye/auth/google_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      }

      if (data.status && data.auth_url) {
        let modifiedAuthUrl = data.auth_url.includes('?')
          ? `${data.auth_url}&format=html`
          : `${data.auth_url}?format=html`;
        const popup = window.open(modifiedAuthUrl, 'googleSignInPopup', 'width=600,height=600');
        if (!popup) {
          Swal.fire({
            icon: 'error',
            title: 'Popup Blocked',
            text: 'Please allow popups for this website and try again.',
          });
          return;
        }
        window.addEventListener('message', function messageHandler(event) {
          if (event.data && event.data.type === 'googleLoginSuccess') {
            const { token, users_id, email } = event.data;
            if (token && users_id) {
              dispatch({
                type: 'auth/setUser',
                payload: { userId: users_id, email: email || '', token },
              });
              Swal.fire({
                icon: 'success',
                title: 'Login Successful!',
                text: 'Redirecting to your profile...',
                timer: 2000,
                showConfirmButton: false,
              }).then(() => {
                navigate('/profile');
              });
              window.removeEventListener('message', messageHandler);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid authentication data received.',
              });
            }
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Google Login Failed',
          text: data.message || 'Unable to start Google login.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect to the server. Please try again later.',
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
            <div className="signin-form">
              <h2>Log in to Exclusive</h2>
              <p className="text-muted">Enter your details below</p>
              <form id="loginForm" onSubmit={handleLogin}>
                <div className="mb-3">
                  <input
                    type="email"
                    name="email"
                    className="signin-input"
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
                    className="signin-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="button-container">
                  <button type="submit" className="signin-submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Log In'}
                  </button>
                  <div className="forgot-password">
                    <a href="#" onClick={handleForgotPassword}>
                      Forgot Password?
                    </a>
                  </div>
                </div>
              </form>
              <button className="google-signin" onClick={handleGoogleSignIn}>
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Logo" />
                Sign in with Google
              </button>
              <div className="signup-link" style={{ marginTop: '15px' }}>
                <p>
                  Don't have an account?{' '}
                  <a href="/signup" className="text-log">
                    Sign Up
                  </a>
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