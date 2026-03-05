import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TicketStatus } from "@/src/types";

interface ActiveTicket {
  id: string;
  publicId: string;
  displayNumber: string;
  queueId: string;
  status: TicketStatus;
  position?: number;
  estimatedWait?: number;
}

interface TicketState {
  activeTicket: ActiveTicket | null;
}

const initialState: TicketState = {
  activeTicket: null,
};

const ticketSlice = createSlice({
  name: "ticket",
  initialState,
  reducers: {
    setActiveTicket(state, action: PayloadAction<ActiveTicket>) {
      state.activeTicket = action.payload;
    },
    updateTicketStatus(state, action: PayloadAction<Partial<ActiveTicket>>) {
      if (state.activeTicket) {
        state.activeTicket = { ...state.activeTicket, ...action.payload };
      }
    },
    clearActiveTicket(state) {
      state.activeTicket = null;
    },
  },
});

export const { setActiveTicket, updateTicketStatus, clearActiveTicket } =
  ticketSlice.actions;
export default ticketSlice.reducer;
