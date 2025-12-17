import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Navbar from '@/components/UiComponents/UserNavbar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { chatService } from '@/services/chatService';
import { API_BASE_URL } from '@/constants/apiRoutes';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    searchParams.get('room') || null
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize user
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUserId(user._id || user.id);
      }
    } catch (err) {
      console.error('Failed to get user:', err);
    }
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUserId) return;

    const token = localStorage.getItem('auth_token');
    const socketUrl = API_BASE_URL.replace('/api', '');
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Chat socket connected');
    });

    newSocket.on('chat:receive_message', (message) => {
      // Add duplicate detection - check if message already exists by _id
      setMessages((prev) => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    newSocket.on('chat:delivered', (data) => {
      console.log('Messages delivered:', data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === currentUserId
            ? {
                ...msg,
                deliveredTo: [...(msg.deliveredTo || []), data.userId],
              }
            : msg
        )
      );
    });

    newSocket.on('chat:message_seen', (data) => {
      console.log('Message seen by:', data);
      setMessages((prev) =>
        prev.map((msg) => {
          const seenByIds = (msg.seenBy || []).map((id: any) => id.toString?.() || id);
          const seenByUserId = data.seenBy.toString?.() || data.seenBy;
          
          if (msg.senderId === currentUserId && !seenByIds.includes(seenByUserId)) {
            return {
              ...msg,
              seenBy: [...(msg.seenBy || []), data.seenBy],
            };
          }
          return msg;
        })
      );
    });

    newSocket.on('chat:typing_status', (data) => {
      console.log('Typing status:', data);
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId]);

  // Load rooms
  useEffect(() => {
    if (!currentUserId) return;

    const loadRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const data = await chatService.listRooms();
        setRooms(data);

        // Auto-select first room if no room selected
        if (!selectedRoomId && data.length > 0) {
          setSelectedRoomId(data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, [currentUserId, selectedRoomId]);

  // Load messages for selected room
  useEffect(() => {
    if (!selectedRoomId || !currentUserId) return;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const data = await chatService.listMessages(selectedRoomId, 1, 50);
        // Backend returns { messages: [], total, page, limit }
        setMessages(data.messages || []);

        // Join room via socket (but don't mark as seen yet)
        if (socket) {
          socket.emit('chat:join', { roomId: selectedRoomId });
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Cleanup: leave room when unmounting or switching rooms
    return () => {
      if (socket) {
        socket.emit('chat:leave', { roomId: selectedRoomId });
      }
    };
  }, [selectedRoomId, currentUserId, socket]);

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!selectedRoomId || !currentUserId) return;

    try {
      setIsSending(true);

      // Send via socket for real-time
      if (socket) {
        socket.emit('chat:send_message', {
          roomId: selectedRoomId,
          content,
        });
      } else {
        // Fallback to HTTP
        await chatService.sendMessage(selectedRoomId, content);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-500">
          Please log in to access chat
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 h-[calc(100vh-200px)] bg-white rounded-lg shadow overflow-hidden">
          {/* Sidebar */}
          <ChatSidebar
            rooms={rooms}
            selectedRoomId={selectedRoomId || undefined}
            onSelectRoom={setSelectedRoomId}
            isLoading={isLoadingRooms}
            currentUserId={currentUserId || undefined}
          />

          {/* Chat Window */}
          {selectedRoomId ? (
            <ChatWindow
              roomId={selectedRoomId}
              messages={messages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
              isLoading={isSending || isLoadingMessages}
              otherUserName="Chat User"
              listingId={rooms.find((r) => r._id === selectedRoomId)?.listingId}
              socket={socket}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
