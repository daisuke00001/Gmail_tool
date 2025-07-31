import axios from 'axios';
import { UserPattern, EmailLog, ScheduleSettings } from '../types';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async getPatterns(): Promise<UserPattern[]> {
    const response = await api.get('/patterns');
    return response.data;
  },

  async addPattern(pattern: string, description: string): Promise<UserPattern> {
    const response = await api.post('/patterns', { pattern, description });
    return response.data;
  },

  async updatePattern(id: number, pattern: string, description: string, enabled: boolean): Promise<void> {
    await api.put(`/patterns/${id}`, { pattern, description, enabled });
  },

  async deletePattern(id: number): Promise<void> {
    await api.delete(`/patterns/${id}`);
  },

  async getRecentEmails(): Promise<EmailLog[]> {
    const response = await api.get('/emails/recent');
    return response.data;
  },

  async manualEmailCheck(): Promise<{ success: boolean; message: string; emails: EmailLog[] }> {
    const response = await api.post('/emails/check');
    return response.data;
  },

  async getScheduleSettings(): Promise<{ settings: ScheduleSettings; activeSchedules: any[] }> {
    const response = await api.get('/schedule');
    return response.data;
  },

  async updateScheduleSettings(
    startTime: string,
    intervalHours: number,
    enabled: boolean,
    notificationEnabled: boolean
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/schedule', {
      startTime,
      intervalHours,
      enabled,
      notificationEnabled,
    });
    return response.data;
  },

  async getAuthUrl(): Promise<{ authUrl: string }> {
    const response = await api.get('/auth/url');
    return response.data;
  },

  async saveAuthToken(code: string): Promise<{ success: boolean; tokens: any }> {
    const response = await api.post('/auth/token', { code });
    return response.data;
  },

  getNotificationStream(): EventSource {
    return new EventSource(`${API_BASE}/notifications/stream`);
  },
};