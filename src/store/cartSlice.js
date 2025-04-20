import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = "https://abdulrahmanantar.com/outbye/";
const ENDPOINTS = {
  VIEW: `${API_BASE_URL}cart/view.php`,
  ADD: `${API_BASE_URL}cart/add.php`,
  DELETE: `${API_BASE_URL}cart/delet.php`,
  COUPON: `${API_BASE_URL}coupon/checkcoupon.php`,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (userId, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.VIEW, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId }).toString(),
    });
    const data = await response.json();
    if (data.status === 'success') {
      return data;
    } else {
      return rejectWithValue(data.message || 'Failed to fetch cart');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error fetching cart');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ userId, itemId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId, quantity }).toString(),
    });
    const data = await response.json();
    if (data.success) {
      return { itemId, quantity };
    } else {
      return rejectWithValue(data.message || 'Unable to add item to cart');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error adding item to cart');
  }
});

export const increaseItemQuantity = createAsyncThunk('cart/increaseItemQuantity', async ({ userId, itemId }, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId }).toString(),
    });
    const data = await response.json();
    if (data.success) {
      return { itemId };
    } else {
      return rejectWithValue(data.message || 'Unable to increase quantity');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error increasing quantity');
  }
});

export const decreaseItemQuantity = createAsyncThunk('cart/decreaseItemQuantity', async ({ userId, itemId }, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.DELETE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId }).toString(),
    });
    const data = await response.json();
    if (data.success) {
      return { itemId };
    } else {
      return rejectWithValue(data.message || 'Unable to decrease quantity');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error decreasing quantity');
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async ({ userId, couponName }, { rejectWithValue, getState }) => {
  const { cart } = getState();
  if (cart.isCouponApplied) {
    return rejectWithValue('A coupon has already been applied! Complete checkout to apply a new one.');
  }

  try {
    const response = await fetch(ENDPOINTS.COUPON, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ couponname: couponName, usersid: userId }).toString(),
    });
    const data = await response.json();
    if (data.status === 'success' && data.data) {
      const discountPercentage = parseFloat(data.data.coupon_discount) || 0;
      const expireDate = new Date(data.data.coupon_expiredate);
      const now = new Date();
      const remainingCount = parseInt(data.data.coupon_count) || 0;

      if (expireDate < now) {
        return rejectWithValue('Coupon code has expired!');
      }
      if (remainingCount <= 0) {
        return rejectWithValue('Coupon code has been fully used!');
      }
      return discountPercentage;
    } else {
      return rejectWithValue(data.message || 'Coupon is not available or has expired!');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error applying coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: {},
    couponDiscount: 0,
    isCouponApplied: false,
    status: 'idle',
    error: null,
  },
  reducers: {
    resetCart: (state) => {
      state.items = {};
      state.couponDiscount = 0;
      state.isCouponApplied = false;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(increaseItemQuantity.fulfilled, (state, action) => {
        const { itemId } = action.payload;
        Object.values(state.items).forEach(category => {
          if (category.datacart) {
            const item = category.datacart.find(item => item.cart_itemsid === itemId);
            if (item) {
              item.cart_quantity = parseInt(item.cart_quantity) + 1;
            }
          }
        });
      })
      .addCase(increaseItemQuantity.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(decreaseItemQuantity.fulfilled, (state, action) => {
        const { itemId } = action.payload;
        Object.values(state.items).forEach(category => {
          if (category.datacart) {
            const itemIndex = category.datacart.findIndex(item => item.cart_itemsid === itemId);
            if (itemIndex !== -1) {
              const item = category.datacart[itemIndex];
              item.cart_quantity = parseInt(item.cart_quantity) - 1;
              if (item.cart_quantity <= 0) {
                category.datacart.splice(itemIndex, 1);
              }
            }
          }
        });
      })
      .addCase(decreaseItemQuantity.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.couponDiscount = action.payload;
        state.isCouponApplied = true;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.couponDiscount = 0;
        state.isCouponApplied = false;
        state.error = action.payload;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;