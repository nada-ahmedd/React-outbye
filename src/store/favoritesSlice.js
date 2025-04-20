import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch favorites
export const fetchFavorites = createAsyncThunk('favorites/fetchFavorites', async (userId, { rejectWithValue }) => {
  try {
    const response = await fetch('https://abdulrahmanantar.com/outbye/favorite/view.php', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ id: userId }).toString(),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error('Invalid JSON response');

    const data = JSON.parse(text.substring(jsonStart, jsonEnd));
    if (data.status === 'success' && Array.isArray(data.data)) {
      const uniqueItems = [];
      const seenItems = new Set();
      data.data.forEach((item) => {
        if (!seenItems.has(item.favorite_itemsid)) {
          seenItems.add(item.favorite_itemsid);
          uniqueItems.push(item);
        }
      });
      return uniqueItems;
    }
    return [];
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Async thunk to add/remove favorite
export const toggleFavorite = createAsyncThunk('favorites/toggleFavorite', async ({ userId, itemId, isFavorited }, { rejectWithValue }) => {
  try {
    const url = isFavorited
      ? 'https://abdulrahmanantar.com/outbye/favorite/remove.php'
      : 'https://abdulrahmanantar.com/outbye/favorite/add.php';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId }).toString(),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error('Invalid JSON response');

    const data = JSON.parse(text.substring(jsonStart, jsonEnd));
    if (data.status === 'success') {
      return { itemId, isFavorited, favoriteId: data.favorite_id || null };
    }
    throw new Error(data.message || 'Failed to toggle favorite');
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { itemId, isFavorited, favoriteId } = action.payload;
        if (isFavorited) {
          state.items = state.items.filter((item) => item.favorite_itemsid !== itemId);
        } else {
          state.items.push({ favorite_itemsid: itemId, favorite_id: favoriteId });
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;