import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS يتحمل الأول
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Bootstrap JS
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/Navbar.css'; // Custom Navbar CSS يتحمل بعد Bootstrap
import './index.css'; // Global CSS (بيتحمل الأخير لو فيه)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);