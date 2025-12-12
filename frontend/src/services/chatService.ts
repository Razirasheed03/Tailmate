import httpClient from './httpClient';
import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/marketplace.types';

export const chatService = {
  startChat: async (listingId: string, receiverId: string): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.post(
      '/chat/start',
      { listingId, receiverId }
    );
    return res.data?.data ?? res.data;
  },

  listRooms: async (): Promise<any[]> => {
    const res: AxiosResponse<ApiResponse<any[]>> = await httpClient.get('/chat/rooms');
    return res.data?.data ?? [];
  },

  listMessages: async (
    roomId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.get(
      `/chat/messages/${roomId}`,
      { params: { page, limit } }
    );
    return res.data?.data ?? res.data;
  },

  sendMessage: async (roomId: string, content: string): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.post(
      '/chat/send',
      { roomId, content }
    );
    return res.data?.data ?? res.data;
  },

  markDelivered: async (roomId: string): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.post(
      `/chat/delivered/${roomId}`
    );
    return res.data?.data ?? res.data;
  },

  markSeen: async (roomId: string): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.post(
      `/chat/seen/${roomId}`
    );
    return res.data?.data ?? res.data;
  },
};
