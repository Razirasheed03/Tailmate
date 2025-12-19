export interface IChatRepository {
  findOrCreateRoom(
    listingId: string,
    userId1: string,
    userId2: string
  ): Promise<any>;

  findRoomById(roomId: string): Promise<any | null>;

  listRoomsByUser(userId: string): Promise<any[]>;

  updateLastMessage(
    roomId: string,
    message: string
  ): Promise<any>;
}
