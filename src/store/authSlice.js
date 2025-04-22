import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch('https://abdulrahmanantar.com/outbye/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(credentials).toString(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(tokenExpired());
          throw new Error('Token expired');
        }
        throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
      }
      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }

      if (data.status === 'success') {
        return { user_id: data.user_id, token: data.token, isAdmin: data.isAdmin || false };
      } else {
        return rejectWithValue(data.message || 'Incorrect email or password');
      }
    } catch (error) {
      console.error('LoginUser Error:', error);
      return rejectWithValue(error.message || 'Network Error: Please try again later.');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch('https://abdulrahmanantar.com/outbye/auth/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(userData).toString(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(tokenExpired());
          throw new Error('Token expired');
        }
        throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
      }
      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }

      if (data.status === 'success') {
        return { user_id: data.user_id, token: data.token };
      } else {
        return rejectWithValue(data.message || 'Failed to sign up');
      }
    } catch (error) {
      console.error('SignupUser Error:', error);
      return rejectWithValue(error.message || 'Network Error: Please try again later.');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://abdulrahmanantar.com/outbye/profile/view.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({ users_id: userId }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(tokenExpired());
          throw new Error('Token expired');
        }
        throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
      }
      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }

      if (data.status === 'success') {
        return data.data;
      } else {
        return rejectWithValue(data.message || 'Failed to fetch profile data');
      }
    } catch (error) {
      console.error('FetchUserProfile Error:', error);
      return rejectWithValue(error.message || 'Network Error: Please try again later.');
    }
  }
);

export const checkEmail = createAsyncThunk(
  'auth/checkEmail',
  async (email, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch('https://abdulrahmanantar.com/outbye/forgetpassword/checkemail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(tokenExpired());
          throw new Error('Token expired');
        }
        throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
      }
      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }

      if (data.success) {
        return data;
      } else {
        return rejectWithValue(data.message || 'Email not found');
      }
    } catch (error) {
      console.error('CheckEmail Error:', error);
      return rejectWithValue(error.message || 'Network Error: Please try again later.');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Reset Password Payload:', { email, password });
      const response = await fetch('https://abdulrahmanantar.com/outbye/forgetpassword/resetpassword.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(tokenExpired());
          throw new Error('Token expired');
        }
        throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
      }
      const text = await response.text();
      console.log('Reset Password API Raw Response:', text);
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse JSON:', parseError.message);
        }
      }
      console.log('Reset Password API Parsed Response:', data);

      if (data.status === 'success') {
        return data;
      } else {
        return rejectWithValue(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('ResetPassword Error:', error);
      return rejectWithValue(error.message || 'Network Error: Please try again later.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true' || false,
    isAdminLoggedIn: localStorage.getItem('isAdminLoggedIn') === 'true' || false,
    userId: localStorage.getItem('userId') || null,
    email: localStorage.getItem('email') || null,
    token: localStorage.getItem('token') || null,
    profile: JSON.parse(localStorage.getItem('profileData')) || null,
    resetEmail: localStorage.getItem('resetEmail') || null,
    loading: false,
    error: null,
    tokenExpired: false, // إضافة حقل جديد لتتبع حالة انتهاء التوكن
  },
  reducers: {
    setUser(state, action) {
      state.isLoggedIn = true;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.token = action.payload.token;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', action.payload.userId);
      localStorage.setItem('email', action.payload.email);
      localStorage.setItem('token', action.payload.token);
    },
    setAdmin(state, action) {
      state.isAdminLoggedIn = true;
      state.userId = action.payload.adminId;
      state.token = action.payload.adminToken;
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminId', action.payload.adminId);
      localStorage.setItem('adminToken', action.payload.adminToken);
    },
    setProfile(state, action) {
      state.profile = action.payload;
      localStorage.setItem('profileData', JSON.stringify(action.payload));
    },
    logout(state) {
      state.isLoggedIn = false;
      state.isAdminLoggedIn = false;
      state.userId = null;
      state.email = null;
      state.token = null;
      state.profile = null;
      state.resetEmail = null;
      state.tokenExpired = false;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      localStorage.removeItem('profileData');
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('favoritesCache');
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('signupEmail');
    },
    tokenExpired(state) {
      state.isLoggedIn = false;
      state.isAdminLoggedIn = false;
      state.userId = null;
      state.email = null;
      state.token = null;
      state.profile = null;
      state.resetEmail = null;
      state.tokenExpired = true; // تغيير الحالة لإشعار App.jsx
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      localStorage.removeItem('profileData');
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('favoritesCache');
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('signupEmail');
    },
    clearTokenExpired(state) {
      state.tokenExpired = false; // تصفير الحالة بعد التعامل معاها
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.isAdminLoggedIn = action.payload.isAdmin;
        state.userId = action.payload.user_id;
        state.token = action.payload.token;
        state.email = action.meta.arg.email || '';
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', action.payload.user_id);
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('email', action.meta.arg.email || '');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.userId = action.payload.user_id;
        state.token = action.payload.token;
        state.email = action.meta.arg.email || '';
        localStorage.setItem('signupEmail', action.meta.arg.email || '');
        localStorage.setItem('userId', action.payload.user_id);
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('email', action.meta.arg.email || '');
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        localStorage.setItem('profileData', JSON.stringify(action.payload));
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.resetEmail = action.meta.arg;
        localStorage.setItem('resetEmail', action.meta.arg);
      })
      .addCase(checkEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetEmail = null;
        localStorage.removeItem('resetEmail');
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, setAdmin, setProfile, logout, tokenExpired, clearTokenExpired, setLoading, setError, clearError } = authSlice.actions;
export default authSlice.reducer;