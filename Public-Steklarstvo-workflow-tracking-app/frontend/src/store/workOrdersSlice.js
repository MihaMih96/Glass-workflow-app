import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import processWorkOrderData from "../utils/processWorkOrderData";
import api from "../services/api"; // Uvozi Axios instanco

// Thunk za pridobivanje vseh delovnih nalogov z obdelavo podatkov
export const getAllWorkOrders = createAsyncThunk(
  "workOrders/getAllWorkOrders",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/workorders");
      // Procesiramo vsakega izmed nalogov (vključno z novimi polji)
      const processedData = response.data.map(order => processWorkOrderData(order));
      return processedData;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Thunk za pridobivanje posameznega delovnega naloga
export const getWorkOrder = createAsyncThunk(
  "workOrders/getWorkOrder",
  async (docId, thunkAPI) => {
    try {
      const response = await api.get(`/api/workorders/${docId}`);
      const processedData = processWorkOrderData(response.data);
      return processedData;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Thunk za posodabljanje delovnega naloga v bazi
export const updateWorkOrderThunk = createAsyncThunk(
  "workOrders/updateWorkOrder",
  async (updatedOrder, thunkAPI) => {
    try {
      const response = await api.post("/api/workorders", updatedOrder);
      return processWorkOrderData(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteWorkOrderThunk = createAsyncThunk(
  "workOrders/deleteWorkOrder",
  async (orderId, thunkAPI) => {
    try {
      await api.delete(`/api/workorders/${orderId}`);
      return orderId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const workOrdersSlice = createSlice({
  name: "workOrders",
  initialState: {
    orders: [],
    loading: false,
    error: null,
  },
  reducers: {
    addWorkOrder: (state, action) => {
      state.orders.push(action.payload);
    },
    updateWorkOrder: (state, action) => {
      // Lokalno posodobi naročilo brez klica API-ja.
      // Ta reducer sedaj vključuje tudi nova polja:
      // montaza, prevzem, additionalInstructions, additionalAddress, confirmed.
      const index = state.orders.findIndex(order => order.mk_id === action.payload.mk_id);
      if (index !== -1) {
        const updatedOrder = {
          ...state.orders[index],
          ...action.payload,
        };
        if (action.payload.create_product_realization_list) {
          updatedOrder.create_product_realization_list = action.payload.create_product_realization_list.map(newItem => {
            const oldItem = state.orders[index].create_product_realization_list.find(item => item.product_code === newItem.product_code);
            return {
              ...newItem,
              cellId: newItem.cellId || (oldItem ? oldItem.cellId : newItem.cellId)
            };
          });
        }
        state.orders[index] = updatedOrder;
      } else {
        state.orders.push(action.payload);
      }
    },
    markWorkOrderReady: (state, action) => {
      const orderId = action.payload;
      const index = state.orders.findIndex(order => order._id === orderId || order.mk_id === orderId);
      if (index !== -1) {
        state.orders[index].ready = "Zaključeno";
        state.orders[index].workshopCompleted = true;
      }
    },
    markForMontaza: (state, action) => {
      const orderId = action.payload;
      const index = state.orders.findIndex(order => order._id === orderId || order.mk_id === orderId);
      if (index !== -1) {
        state.orders[index].readyForMontaza = true;
      }
    },
    clearOrders: (state) => {
      state.orders = [];
      state.error = null;
    },
  },
extraReducers: (builder) => {
  builder
    .addCase(getAllWorkOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getAllWorkOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    })
    .addCase(getAllWorkOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase(getWorkOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getWorkOrder.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.orders.findIndex(order => order.mk_id === action.payload.mk_id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      } else {
        state.orders.push(action.payload);
      }
    })
    .addCase(getWorkOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase(updateWorkOrderThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateWorkOrderThunk.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.orders.findIndex(order => order.mk_id === action.payload.mk_id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      } else {
        state.orders.push(action.payload);
      }
    })
    .addCase(updateWorkOrderThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ----- DELETE WORKORDER -----
    .addCase(deleteWorkOrderThunk.fulfilled, (state, action) => {
      state.orders = state.orders.filter(
        order =>
          order._id !== action.payload && order.mk_id !== action.payload
      );
    })
    .addCase(deleteWorkOrderThunk.rejected, (state, action) => {
      state.error = action.payload;
    });
},
  
});

export const { addWorkOrder, updateWorkOrder, markWorkOrderReady, markForMontaza, clearOrders } = workOrdersSlice.actions;

export default workOrdersSlice.reducer;
