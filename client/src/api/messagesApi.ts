import { axiosInstance } from './axiosInstance';

export interface ChatMessageDTO {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system';
}

export const messagesApi = {
  async getRoomMessages(
    room: string,
    page = 1,
    limit = 50
  ): Promise<ChatMessageDTO[]> {
    const { data } = await axiosInstance.get('/messages', {
      params: { room, page, limit },
    });
    return data.data.messages as ChatMessageDTO[];
  },
};
