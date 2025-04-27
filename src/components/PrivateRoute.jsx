import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import Swal from 'sweetalert2';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, tokenExpiresAt } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Check if user is not logged in
  if (!isLoggedIn) {
    return <Navigate to="/signin" />;
  }

  // Check if token has expired
  if (tokenExpiresAt && Date.now() > parseInt(tokenExpiresAt)) {
    Swal.fire({
      icon: 'info',
      title: 'Session Expired',
      text: 'Your session has expired. Please log in again.',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      dispatch(logout());
    });
    return <Navigate to="/signin" />;
  }

  return children;
};

export default PrivateRoute;