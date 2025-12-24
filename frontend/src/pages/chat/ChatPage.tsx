import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
// import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/UiComponents/UserNavbar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { chatService } from '@/services/chatService';
import { API_BASE_URL } from '@/constants/apiRoutes';

export default function ChatPage() {
  // const { user } = useAuth(); // Get fresh user from context, not localStorage
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    searchParams.get('room') || null
  );
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, any[]>>({});
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unseenCounts, setUnseenCounts] = useState<Record<string, number>>({});
  
  // Use ref to track active room to avoid stale closures in socket listeners
  const activeRoomIdRef = useRef<string | null>(null);
  // Track if ChatPage is mounted and visible to prevent false auto-seen
  const isPageVisibleRef = useRef<boolean>(true);
  // Track which messages we've already marked as seen to prevent duplicates
  const markedSeenMessagesRef = useRef<Set<string>>(new Set());

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

    // Receive message from socket (includes own messages now)
    newSocket.on('chat:receive_message', (message) => {
      const messageRoomId = message.roomId?.toString() || message.roomId;
      
      console.log('[Chat] 📥 Received message:', {
        messageId: message._id,
        roomId: messageRoomId,
        senderId: message.senderId,
        isFromMe: message.senderId === currentUserId,
        activeRoom: activeRoomIdRef.current,
        pageVisible: isPageVisibleRef.current,
      });
      
      // ALWAYS append message to the correct room (real-time delivery)
      setMessagesByRoom((prev) => {
        const roomMessages = prev[messageRoomId] || [];
        // Add duplicate detection - check if message already exists by _id
        const exists = roomMessages.some(m => m._id === message._id);
        if (exists) {
          console.log('[Chat] ⚠️ Duplicate message, ignoring');
          return prev;
        }
        
        console.log('[Chat] ✅ Adding message to room:', messageRoomId);
        return {
          ...prev,
          [messageRoomId]: [...roomMessages, message],
        };
      });
      
      // Handle unseen count and mark as seen logic
      if (message.senderId !== currentUserId) {
        // Use ref to avoid stale closure - always get current active room
        const currentActiveRoom = activeRoomIdRef.current;
        const isPageVisible = isPageVisibleRef.current;
        
        console.log('[Chat] 📊 Checking if should mark as seen:', {
          messageRoomId,
          currentActiveRoom,
          isPageVisible,
          shouldMarkSeen: messageRoomId === currentActiveRoom && isPageVisible,
        });
        
        // Only mark as seen if:
        // 1. User is viewing this specific chat (messageRoomId === currentActiveRoom)
        // 2. AND the page is actually visible (not background tab, not unmounted)
        if (messageRoomId === currentActiveRoom && isPageVisible) {
          // User is actively viewing this chat - mark new message as seen IMMEDIATELY
          console.log('[Chat] ✅ Marking message as seen (user is viewing this chat)');
          newSocket.emit('chat:mark_seen', { roomId: messageRoomId });
          
          // Track that we've marked this message as seen
          markedSeenMessagesRef.current.add(message._id);
        } else {
          // User is NOT viewing this chat OR page is not visible - increment unseen count
          console.log('[Chat] 📬 Incrementing unseen count (user not viewing or page hidden)');
          setUnseenCounts((prev) => ({
            ...prev,
            [messageRoomId]: (prev[messageRoomId] || 0) + 1,
          }));
        }
      } else {
        console.log('[Chat] ℹ️ Message is from current user, no action needed');
      }
    });

    newSocket.on('chat:delivered', (data) => {
      console.log('[Chat] ✅ Messages delivered:', data);
      setMessagesByRoom((prev) => {
        const updated: Record<string, any[]> = {};
        for (const [roomId, messages] of Object.entries(prev)) {
          updated[roomId] = messages.map((msg) =>
            msg.senderId === currentUserId
              ? {
                  ...msg,
                  deliveredTo: [...(msg.deliveredTo || []), data.userId],
                }
              : msg
          );
        }
        return updated;
      });
    });

    // Message seen status update
    newSocket.on('chat:message_seen', (data) => {
      console.log('[Chat] 👁️ Message seen by:', data);
      setMessagesByRoom((prev) => {
        const updated: Record<string, any[]> = {};
        for (const [roomId, messages] of Object.entries(prev)) {
          updated[roomId] = messages.map((msg) => {
            const seenByIds = (msg.seenBy || []).map((id: any) => id.toString?.() || id);
            const seenByUserId = data.seenBy.toString?.() || data.seenBy;
            
            if (msg.senderId === currentUserId && !seenByIds.includes(seenByUserId)) {
              return {
                ...msg,
                seenBy: [...(msg.seenBy || []), data.seenBy],
              };
            }
            return msg;
          });
        }
        return updated;
      });
    });
    
    newSocket.on('chat:typing_status', (data) => {
      console.log('[Chat] ⌨️ Typing status:', data);
    });

    newSocket.on('error', (err) => {
      console.error('[Chat] ❌ Socket error:', err);
    });

    setSocket(newSocket);

    return () => {
      console.log('[Chat] 🔌 Disconnecting socket');
      newSocket.disconnect();
    };
  }, [currentUserId]);

  // Load rooms and calculate unseen counts
  useEffect(() => {
    if (!currentUserId) return;

    const loadRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const data = await chatService.listRooms();
        setRooms(data);

        // Calculate unseen counts for each room
        const counts: Record<string, number> = {};
        for (const room of data) {
          try {
            const messagesData = await chatService.listMessages(room._id, 1, 100);
            const unseenCount = (messagesData.messages || []).filter((msg: any) => {
              // Count messages from other users that current user hasn't seen
              if (msg.senderId === currentUserId) return false;
              const seenByIds = (msg.seenBy || []).map((id: any) => 
                typeof id === 'string' ? id : id._id || id.toString()
              );
              return !seenByIds.includes(currentUserId);
            }).length;
            counts[room._id] = unseenCount;
          } catch (err) {
            console.error(`Failed to calculate unseen for room ${room._id}:`, err);
            counts[room._id] = 0;
          }
        }
        setUnseenCounts(counts);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, [currentUserId]);

  // Track page visibility to prevent marking messages as seen when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasVisible = isPageVisibleRef.current;
      isPageVisibleRef.current = !document.hidden;
      
      console.log('[Chat] 👁️ Page visibility changed:', {
        wasVisible,
        nowVisible: isPageVisibleRef.current,
        activeRoom: activeRoomIdRef.current,
      });

      // If page becomes visible again and user has an active room open,
      // mark any unseen messages in that room as seen
      if (!wasVisible && isPageVisibleRef.current && activeRoomIdRef.current && socket) {
        const roomId = activeRoomIdRef.current;
        const roomMessages = messagesByRoom[roomId] || [];
        
        // Check if there are any unseen messages from other users
        const hasUnseenMessages = roomMessages.some((msg: any) => {
          if (msg.senderId === currentUserId) return false;
          const seenByIds = (msg.seenBy || []).map((id: any) => 
            typeof id === 'string' ? id : id._id || id.toString()
          );
          return !seenByIds.includes(currentUserId);
        });

        if (hasUnseenMessages) {
          console.log('[Chat] 📖 Page became visible, marking messages as seen');
          socket.emit('chat:mark_seen', { roomId });
        }
      }
    };

    // Set initial visibility
    isPageVisibleRef.current = !document.hidden;

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark page as not visible when component unmounts
      isPageVisibleRef.current = false;
    };
  }, [socket, messagesByRoom, currentUserId]);

  // Sync ref with selectedRoomId to avoid stale closures
  useEffect(() => {
    activeRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Load messages for selected room and mark as seen
  useEffect(() => {
    if (!selectedRoomId || !currentUserId) return;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        console.log('[Chat] 📂 Loading messages for room:', selectedRoomId);
        
        const data = await chatService.listMessages(selectedRoomId, 1, 50);
        // Backend returns { messages: [], total, page, limit }
        setMessagesByRoom((prev) => ({
          ...prev,
          [selectedRoomId]: data.messages || [],
        }));

        // Join room via socket
        if (socket) {
          console.log('[Chat] 🚪 Joining room via socket:', selectedRoomId);
          socket.emit('chat:join', { roomId: selectedRoomId });
        }

        // Check if there are unseen messages from other user
        const unseenMessages = (data.messages || []).filter((msg: any) => {
          if (msg.senderId === currentUserId) return false;
          const seenByIds = (msg.seenBy || []).map((id: any) => 
            typeof id === 'string' ? id : id._id || id.toString()
          );
          return !seenByIds.includes(currentUserId);
        });

        const hasUnseen = unseenMessages.length > 0;

        console.log('[Chat] 📊 Loaded messages:', {
          total: data.messages?.length || 0,
          unseenCount: unseenMessages.length,
          willMarkSeen: hasUnseen && !!socket,
        });

        // Mark as seen if there are unseen messages (user explicitly opened this chat)
        if (hasUnseen && socket) {
          console.log('[Chat] ✅ Marking existing messages as seen (user opened chat)');
          socket.emit('chat:mark_seen', { roomId: selectedRoomId });
          
          // Track these messages as marked
          unseenMessages.forEach((msg: { _id: string; }) => {
            markedSeenMessagesRef.current.add(msg._id);
          });
        }

        // Reset unseen count for this room
        setUnseenCounts((prev) => ({
          ...prev,
          [selectedRoomId]: 0,
        }));
      } catch (err) {
        console.error('[Chat] ❌ Failed to load messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Cleanup: leave room when unmounting or switching rooms
    return () => {
      if (socket && selectedRoomId) {
        console.log('[Chat] 🚪 Leaving room:', selectedRoomId);
        socket.emit('chat:leave', { roomId: selectedRoomId });
      }
    };
  }, [selectedRoomId, currentUserId, socket]);

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!selectedRoomId || !currentUserId) return;

    try {
      setIsSending(true);
      console.log('[Chat] 📤 Sending message:', { roomId: selectedRoomId, content });

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
      console.error('[Chat] ❌ Failed to send message:', err);
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
            unseenCounts={unseenCounts}
          />

          {/* Chat Window */}
          {selectedRoomId ? (
            <ChatWindow
              roomId={selectedRoomId}
              messages={messagesByRoom[selectedRoomId] || []}
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