import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async Thunk لجلب نتائج البحث من API
export const fetchSearchResults = createAsyncThunk(
  'search/fetchSearchResults',
  async (query, { rejectWithValue }) => {
    try {
      const response = await fetch('https://abdulrahmanantar.com/outbye/items/search.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found');
      }

      const jsonText = text.substring(jsonStart, jsonEnd);
      const data = JSON.parse(jsonText);

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching search results');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    items: [],
    services: [],
    loading: false,
    error: null,
    isResultsVisible: false,
  },
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    clearResults(state) {
      state.items = [];
      state.services = [];
      state.query = '';
      state.isResultsVisible = false;
    },
    setResultsVisible(state, action) {
      state.isResultsVisible = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isResultsVisible = true;
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        state.loading = false;
        const query = state.query.toLowerCase();

        // تصفية الـ items
        state.items = action.payload.items?.data?.filter(
          (item) =>
            item.items_name?.toLowerCase().includes(query) ||
            item.items_name_ar?.toLowerCase().includes(query)
        ) || [];

        // تصفية الـ services
        state.services = action.payload.services?.data?.filter(
          (service) =>
            service.service_name?.toLowerCase().includes(query) ||
            service.service_name_ar?.toLowerCase().includes(query) ||
            service.service_description?.toLowerCase().includes(query) ||
            service.service_description_ar?.toLowerCase().includes(query)
        ) || [];
      })
      .addCase(fetchSearchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
        state.services = [];
      });
  },
});

export const { setQuery, clearResults, setResultsVisible } = searchSlice.actions;
export default searchSlice.reducer;