export interface IChatService {
  startChat(
    currentUserId: string,
    listingId: string,
    receiverId: string
  ): Promise<any>;

  listRooms(currentUserId: string): Promise<any[]>;

  listMessages(
    currentUserId: string,
    roomId: string,
    page?: number,
    limit?: number
  ): Promise<{
    messages: any[];
    total: number;
    page: number;
    limit: number;
  }>;

  sendMessage(
    currentUserId: string,
    roomId: string,
    content: string,
    type?: "text" | "image" | "file",
    attachments?: {
      url: string;
      name: string;
      size: number;
      mimeType: string;
    }[]
  ): Promise<any>;

  markDelivered(
    currentUserId: string,
    roomId: string
  ): Promise<{ success: boolean }>;

  markSeen(
    currentUserId: string,
    roomId: string
  ): Promise<{ success: boolean; modifiedCount: number; matchedCount: number }>;
}
