import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import Footer from './Footer';
import { signupUser } from '../store/authSlice';
import '../styles/SignUp.css';

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

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

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!username) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a username.',
      });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email.',
      });
      return;
    }

    const userData = { username, email, phone, password };
    const result = await dispatch(signupUser(userData));
    if (signupUser.fulfilled.match(result)) {
      Swal.fire({
        icon: 'success',
        title: 'Signed Up!',
        text: 'A verification code has been sent to your email.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/verify-signup');
      });
    }
  };

  const handleGoogleSignUp = async () => {
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

      if (data.status === 'success' && data.auth_url) {
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
                title: 'Sign Up Successful!',
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
                title: 'Sign Up Failed',
                text: 'Invalid authentication data received.',
              });
            }
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Google Sign Up Failed',
          text: data.message || 'Unable to start Google sign up.',
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
      <div className="container-fluid signup-page">
        <div className="row signup-container">
          <div className="col-md-6 p-0">
            <img src="/images/sign.jpg" alt="Signup Image" className="w-100 m-1 signup-image" />
          </div>
          <div className="col-md-6">
            <div className="signup-form">
              <h2>Create an Account</h2>
              <p className="text-muted">Enter your details below</p>
              <form id="signupForm" onSubmit={handleSignUp}>
                <div className="mb-3">
                  <input
                    type="text"
                    name="username"
                    className="signup-input"
                    placeholder="User Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    name="email"
                    className="signup-input"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="tel"
                    name="phone"
                    className="signup-input"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    name="password"
                    className="signup-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="signup-submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Create Account'}
                </button>
              </form>
              <div className="login-link">
                <p>
                  Already have an account?{' '}
                  <a href="/signin" className="text-log">
                    Log in
                  </a>
                </p>
              </div>
              <button className="google-signup" onClick={handleGoogleSignUp}>
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Logo" />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignUp;