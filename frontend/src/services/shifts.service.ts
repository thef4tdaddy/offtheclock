import axios from 'axios';

const API_URL = '/api/shifts';

export interface Shift {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  upt_log_id?: number;
  series_id?: string;
}

export interface ShiftCreate {
  start_time: string;
  end_time: string;
}

export const shiftsService = {
  getShifts: async (): Promise<Shift[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  createShift: async (shift: ShiftCreate): Promise<Shift> => {
    const response = await axios.post(API_URL, shift);
    return response.data;
  },

  createBatchShifts: async (shifts: ShiftCreate[]): Promise<Shift[]> => {
    const response = await axios.post(`${API_URL}/batch`, shifts);
    return response.data;
  },

  deleteShift: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  deleteShiftSeries: async (seriesId: string): Promise<void> => {
    await axios.delete(`${API_URL}/series/${seriesId}`);
  },
};
