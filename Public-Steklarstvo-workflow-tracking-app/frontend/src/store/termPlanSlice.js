import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api'; // Axios instanca

export const getTermPlan = createAsyncThunk(
  'termPlan/getTermPlan',
  async (weekKey, thunkAPI) => {
    try {
      const response = await api.get(`/api/termplans/${weekKey}`);
      // API zdaj vrne objekt z obema poljema: { gridData, dayNotes }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateTermPlan = createAsyncThunk(
  'termPlan/updateTermPlan',
  async ({ weekKey, gridData, dayNotes }, thunkAPI) => {
    try {
      const response = await api.post('/api/termplans', { weekKey, gridData, dayNotes });
      // Vrne celoten terminski plan, torej { gridData, dayNotes }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentWeekKey: "", // npr. "2025-02-24"
  weeks: {}, // { [weekKey]: { gridData, dayNotes } }
  loading: false,
  error: null,
};

const termPlanSlice = createSlice({
  name: 'termPlan',
  initialState,
  reducers: {
    setCurrentWeekKey: (state, action) => {
      state.currentWeekKey = action.payload;
    },
    setGridData: (state, action) => {
      // Pričakujemo objekt: { gridData, dayNotes }
      state.weeks[state.currentWeekKey] = action.payload;
    },
    updateCell: (state, action) => {
      const { row, col, field, value } = action.payload;
      const termPlan = state.weeks[state.currentWeekKey];
      if (termPlan && Array.isArray(termPlan.gridData[row][field])) {
        termPlan.gridData[row][field][col] = value;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTermPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTermPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.weeks[state.currentWeekKey] = action.payload;
      })
      .addCase(getTermPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTermPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTermPlan.fulfilled, (state, action) => {
        state.loading = false;
        // Shrani celoten terminski plan, vključno z dayNotes
        state.weeks[state.currentWeekKey] = action.payload;
      })
      .addCase(updateTermPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentWeekKey, setGridData, updateCell } = termPlanSlice.actions;
export default termPlanSlice.reducer;
