import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { logout } from '../store/authSlice';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const { isLoggedIn, tokenExpiresAt } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isLoggedIn || !tokenExpiresAt) return;

    const timeUntilExpiration = parseInt(tokenExpiresAt) - Date.now();

    if (timeUntilExpiration <= 0) {
      // Token has expired
      Swal.fire({
        icon: 'info',
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        dispatch(logout());
      });
    } else {
      // Schedule logout when token expires
      const timeout = setTimeout(() => {
        Swal.fire({
          icon: 'info',
          title: 'Session Expired',
          text: 'Your session has expired. Please log in again.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          dispatch(logout());
        });
      }, timeUntilExpiration);

      return () => clearTimeout(timeout);
    }
  }, [isLoggedIn, tokenExpiresAt, dispatch]);

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;