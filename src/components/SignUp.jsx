import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom'; // استيراد Link
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

  return (
    <>
      <Navbar />
      <div className="container-fluid signup-page">
        <div className="row signup-container">
          <div className="col-md-6 p-0">
            <img src="/images/sign.jpg" alt="Signup Image" className="signup-image w-100 m-1" />
          </div>
          <div className="col-md-6">
            <div className="signup-form">
              <h2>Create an Account</h2>
              <p className="text-muted">Enter your details below</p>
              <form onSubmit={handleSignUp}>
                <div className="mb-3">
                  <input
                    type="text"
                    name="username"
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn mb-3" disabled={loading}>
                  {loading ? 'Processing...' : 'Create Account'}
                </button>
              </form>
              <div className="login-link">
                <p>
                  Already have an account?{' '}
                  <Link to="/signin" className="text-log">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignUp;