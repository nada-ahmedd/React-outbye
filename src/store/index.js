import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import searchReducer from './searchSlice';
import favoritesReducer from './favoritesSlice';
import cartReducer from './cartSlice'; // إضافة الـ cartReducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    favorites: favoritesReducer,
    cart: cartReducer, // إضافة الـ cart reducer
  },
});