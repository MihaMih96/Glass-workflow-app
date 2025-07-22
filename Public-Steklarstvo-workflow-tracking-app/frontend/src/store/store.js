// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import workOrdersReducer from './workOrdersSlice';
import termPlanReducer from './termPlanSlice';

const store = configureStore({
  reducer: {
    workOrders: workOrdersReducer,
    termPlan: termPlanReducer,
    // Dodaj druge reducerje, če jih boš imel
  },
});

export default store;
