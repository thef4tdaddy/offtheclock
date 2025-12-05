import axios from 'axios';
import { 
  PTOCategorySchema, 
  PTOLogSchema, 
  type CreateCategoryPayload, 
  type CreateLogPayload,
  type PTOCategory,
  type PTOLog
} from '../domain/schemas/pto';
import { z } from 'zod';

export const ptoService = {
  async getCategories(): Promise<PTOCategory[]> {
    const response = await axios.get('/api/pto/categories');
    return z.array(PTOCategorySchema).parse(response.data);
  },

  async getLogs(): Promise<PTOLog[]> {
    const response = await axios.get('/api/pto/logs');
    return z.array(PTOLogSchema).parse(response.data);
  },

  async createCategory(payload: CreateCategoryPayload): Promise<void> {
    await axios.post('/api/pto/categories', payload);
  },

  async updateCategory(id: number, payload: CreateCategoryPayload): Promise<void> {
    await axios.put(`/api/pto/categories/${id}`, payload);
  },

  async deleteCategory(id: number): Promise<void> {
    await axios.delete(`/api/pto/categories/${id}`);
  },

  async createLog(payload: CreateLogPayload): Promise<void> {
    await axios.post('/api/pto/log', payload);
  },

  async deleteLog(id: number): Promise<void> {
    await axios.delete(`/api/pto/logs/${id}`);
  }
};
