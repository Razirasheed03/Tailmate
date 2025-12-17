import { MessageSquare, Loader, PawPrint } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ChatRoom {
  _id: string;
  listingId?: {
    _id: string;
    title: string;
    photos?: string[];
  };
  users?: Array<{
    _id: string;
    username: string;
    avatar?: string;
  }>;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  isLoading?: boolean;
  currentUserId?: string;
  unseenCounts?: Record<string, number>;
}

export default function ChatSidebar({
  rooms,
  selectedRoomId,
  onSelectRoom,
  isLoading = false,
  currentUserId,
  unseenCounts = {},
}: ChatSidebarProps) {
  const getOtherUser = (room: ChatRoom) => {
    if (!room.users || !currentUserId) return null;
    return room.users.find((u) => u._id !== currentUserId);
  };
  return (
    <div className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={24} className="text-orange-600" />
          Messages
        </h1>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={24} className="animate-spin text-gray-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No chats yet</p>
            <p className="text-sm">Start a conversation with a listing owner</p>
          </div>
        ) : (
          rooms.map((room) => {
            const otherUser = getOtherUser(room);
            return (
              <button
                key={room._id}
                onClick={() => onSelectRoom(room._id)}
                className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${
                  selectedRoomId === room._id ? 'bg-orange-50 border-l-4 border-l-orange-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Listing Photo */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {room.listingId?.photos?.[0] ? (
                      <img
                        src={room.listingId.photos[0]}
                        alt={room.listingId.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PawPrint size={24} className="text-gray-400" />
                    )}
                  </div>

                  {/* Other User & Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {otherUser?.username || 'Chat'}
                      </p>
                      {unseenCounts[room._id] > 0 && (
                        <span className="flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unseenCounts[room._id]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {room.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {/* Time */}
                  {room.lastMessageAt && (
                    <p className="text-xs text-gray-500 flex-shrink-0">
                      {dayjs(room.lastMessageAt).fromNow()}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
