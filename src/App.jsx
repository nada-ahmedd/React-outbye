import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { useState, useEffect } from 'react';
import { tokenExpired, clearTokenExpired } from './store/authSlice';
import Swal from 'sweetalert2';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import VerifySignUp from './components/VerifySignUp';
import VerifyForgetPassword from './components/VerifyForgetPassword';
import Services from './components/Services';
import Items from './components/Items';
import ItemDetail from './components/ItemDetail';
import Favorites from './components/Favorites';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Addresses from './components/Addresses';
import PendingOrders from './components/PendingOrders';
import OrderDetails from './components/OrderDetails';
import Archive from './components/Archive';
import About from './components/About';
import Contact from './components/Contact';
import Loader from './components/Loader';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, isAdminLoggedIn, token, tokenExpired } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  useEffect(() => {
    if ((isLoggedIn || isAdminLoggedIn) && token && isTokenExpired(token)) {
      dispatch(tokenExpired());
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoggedIn, isAdminLoggedIn, token, dispatch]);

  useEffect(() => {
    if (tokenExpired) {
      Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        confirmButtonText: 'Log In',
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
          dispatch(clearTokenExpired());
          navigate('/signin');
        }
      });
    }
  }, [tokenExpired, dispatch, navigate]);

  return (
    <Provider store={store}>
      {isLoading ? (
        <Loader />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services/:id" element={<Services />} />
            <Route path="/items/:id" element={<Items />} />
            <Route path="/item/:itemId" element={<ItemDetail />} />
          </Route>

          <Route
            path="/signup"
            element={isLoggedIn || isAdminLoggedIn ? <Navigate to="/profile" /> : <SignUp />}
          />
          <Route
            path="/signin"
            element={isLoggedIn || isAdminLoggedIn ? <Navigate to="/profile" /> : <SignIn />}
          />

          <Route path="/verify-signup" element={<VerifySignUp />} />
          <Route path="/verify-forget-password" element={<VerifyForgetPassword />} />

          <Route element={<Layout />}>
            <Route
              path="/pending-orders"
              element={
                <PrivateRoute>
                  <PendingOrders />
                </PrivateRoute>
              }
            />
            <Route
              path="/order-details"
              element={
                <PrivateRoute>
                  <OrderDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/addresses"
              element={
                <PrivateRoute>
                  <Addresses />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/archive"
              element={
                <PrivateRoute>
                  <Archive />
                </PrivateRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <Favorites />
                </PrivateRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      )}
    </Provider>
  );
}

export default App;