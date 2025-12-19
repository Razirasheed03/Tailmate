export interface IMessageRepository {
  create(
    roomId: string,
    senderId: string,
    content: string
  ): Promise<any>;

  listByRoom(
    roomId: string,
    page: number,
    limit: number
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  markDelivered(roomId: string, userId: string): Promise<any>;

  markSeen(roomId: string, userId: string): Promise<any>;

  findById(messageId: string): Promise<any | null>;

  getMessagesByRoom(roomId: string): Promise<any[]>;
}
