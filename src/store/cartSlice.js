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
      return {
        rest_cafe: data.rest_cafe || { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
        hotel_tourist: data.hotel_tourist || { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
        offers: data.offers || [], // Store as array
        other_categories: data.other_categories || [],
      };
    } else {
      return rejectWithValue(data.message || 'Failed to fetch cart');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error fetching cart');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ userId, itemId, quantity = 1, type = 'item' }, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId, quantity, type }).toString(),
    });
    const data = await response.json();
    if (data.success) {
      return { itemId, quantity, type };
    } else {
      return rejectWithValue(data.message || 'Unable to add item to cart');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error adding item to cart');
  }
});

export const increaseItemQuantity = createAsyncThunk('cart/increaseItemQuantity', async ({ userId, itemId, type = 'item' }, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId, type }).toString(),
    });
    const data = await response.json();
    if (data.success) {
      return { itemId, type };
    } else {
      return rejectWithValue(data.message || 'Unable to increase quantity');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'Error increasing quantity');
  }
});

export const decreaseItemQuantity = createAsyncThunk('cart/decreaseItemQuantity', async ({ userId, itemId, type = 'item' }, { rejectWithValue }) => {
  try {
    const response = await fetch(ENDPOINTS.DELETE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: new URLSearchParams({ usersid: userId, itemsid: itemId, type }).toString(),
    });
    const data = await response.json();
    if (data.success) {
      return { itemId, type };
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
    items: {
      rest_cafe: { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
      hotel_tourist: { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
      offers: [], // Changed to array
      other_categories: [],
    },
    couponDiscount: 0,
    isCouponApplied: false,
    status: 'idle',
    error: null,
  },
  reducers: {
    resetCart: (state) => {
      state.items = {
        rest_cafe: { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
        hotel_tourist: { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
        offers: [], // Reset to array
        other_categories: [],
      };
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
        state.items = {
          rest_cafe: action.payload.rest_cafe || { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
          hotel_tourist: action.payload.hotel_tourist || { datacart: [], countprice: { totalprice: "0", totalcount: "0" } },
          offers: action.payload.offers || [], // Store as array
          other_categories: action.payload.other_categories || [],
        };
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
        const { itemId, type } = action.payload;
        if (type === 'offer') {
          const offer = state.items.offers.find(item => item.cart_itemsid === itemId);
          if (offer) {
            offer.cart_quantity = parseInt(offer.cart_quantity) + 1;
          }
        } else {
          const categories = [state.items.rest_cafe, state.items.hotel_tourist, ...(state.items.other_categories || [])];
          categories.forEach(category => {
            if (category?.datacart) {
              const item = category.datacart.find(item => item.cart_itemsid === itemId);
              if (item) {
                item.cart_quantity = parseInt(item.cart_quantity) + 1;
              }
            }
          });
        }
      })
      .addCase(increaseItemQuantity.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(decreaseItemQuantity.fulfilled, (state, action) => {
        const { itemId, type } = action.payload;
        if (type === 'offer') {
          const offerIndex = state.items.offers.findIndex(item => item.cart_itemsid === itemId);
          if (offerIndex !== -1) {
            const offer = state.items.offers[offerIndex];
            offer.cart_quantity = parseInt(offer.cart_quantity) - 1;
            if (offer.cart_quantity <= 0) {
              state.items.offers.splice(offerIndex, 1);
            }
          }
        } else {
          const categories = [state.items.rest_cafe, state.items.hotel_tourist, ...(state.items.other_categories || [])];
          categories.forEach(category => {
            if (category?.datacart) {
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
        }
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