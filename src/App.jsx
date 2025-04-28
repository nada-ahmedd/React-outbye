import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { useState, useEffect } from 'react';

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
import AllOffers from './components/AllOffers'; // إضافة الـ import لصفحة AllOffers

function App() {
  const { isLoggedIn, isAdminLoggedIn } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <Router>
        {isLoading ? (
          <Loader />
        ) : (
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/services/:id" element={<Services />} />
              <Route path="/items/:id" element={<Items />} />
              <Route path="/item/:itemId" element={<ItemDetail />} />
              <Route path="/all-offers" element={<AllOffers />} /> {/* إضافة المسار الجديد لصفحة AllOffers */}

              {/* Protected routes */}
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

            {/* Authentication routes */}
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
          </Routes>
        )}
      </Router>
    </Provider>
  );
}

export default App;