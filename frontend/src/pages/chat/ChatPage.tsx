import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/UiComponents/UserNavbar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { chatService } from '@/services/chatService';
import { API_BASE_URL } from '@/constants/apiRoutes';

export default function ChatPage() {
  const { user } = useAuth(); // Get fresh user from context, not localStorage
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
  
  // Use user._id from AuthContext (always fresh)
  const currentUserId = user?._id || null;

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

    // Receive message from socket (includes own messages now)
    newSocket.on('chat:receive_message', (message) => {
      console.log('[Chat] Received message:', message);
      setMessages((prev) => {
        // Avoid duplicates - check if message already exists
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // Message seen status update
    newSocket.on('chat:message_seen', (data) => {
      console.log('[Chat] Message seen by:', data.seenBy);
      setMessages((prev) =>
        prev.map((msg) => {
          // Update seenBy for all messages from other users
          if (msg.senderId !== currentUserId) {
            return msg; // Don't update messages from other users
          }
          
          // For own messages, add seenBy if not already there
          const seenByIds = (msg.seenBy || []).map((id: any) => 
            typeof id === 'string' ? id : id._id || id.toString()
          );
          const seenByUserId = typeof data.seenBy === 'string' ? data.seenBy : data.seenBy._id || data.seenBy.toString();
          
          if (!seenByIds.includes(seenByUserId)) {
            return {
              ...msg,
              seenBy: [...(msg.seenBy || []), data.seenBy],
            };
          }
          return msg;
        })
      );
    });

    // Typing indicator
    newSocket.on('chat:typing_status', (data) => {
      console.log('[Chat] Typing status:', data);
    });

    // User online/offline status
    newSocket.on('chat:user_online', (data) => {
      console.log('[Chat] User online:', data.userId);
    });

    newSocket.on('chat:user_offline', (data) => {
      console.log('[Chat] User offline:', data.userId);
    });

    // Error handling
    newSocket.on('chat:error', (err) => {
      console.error('[Chat] Socket error:', err);
    });

    newSocket.on('error', (err) => {
      console.error('[Socket] Connection error:', err);
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
        setMessages(data.data || []);

        // Join room via socket
        if (socket && socket.connected) {
          socket.emit('chat:join', { roomId: selectedRoomId });
          console.log('[Chat] Joined room:', selectedRoomId);
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
      if (socket && socket.connected) {
        socket.emit('chat:leave', { roomId: selectedRoomId });
        console.log('[Chat] Left room:', selectedRoomId);
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
