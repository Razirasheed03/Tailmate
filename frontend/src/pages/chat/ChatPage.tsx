import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Navbar from '@/components/UiComponents/UserNavbar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { chatService } from '@/services/chatService';

export default function ChatPage() {
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

  // Refs to avoid stale closures
  const activeRoomIdRef = useRef<string | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

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
  const socketUrl = import.meta.env.VITE_API_BASE_URL;
   const newSocket = io(socketUrl, {
  auth: { token },
  transports: ["websocket"],   // important
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

    newSocket.on('connect', () => {
      console.log('[Chat] 🔌 Socket connected');
    });

    // ========================================
    // RECEIVE MESSAGE - Main handler
    // ========================================
    newSocket.on('chat:receive_message', (message) => {
      const messageRoomId = message.roomId?.toString() || message.roomId;
      const messageId = message._id;

      console.log('[Chat] 📥 Received message:', {
        messageId,
        roomId: messageRoomId,
        senderId: message.senderId,
        isFromMe: message.senderId === currentUserId,
        activeRoom: activeRoomIdRef.current,
        pageVisible: isPageVisibleRef.current,
      });

      // ✅ Prevent duplicate processing
      if (processedMessageIdsRef.current.has(messageId)) {
        console.log('[Chat] ⚠️ Duplicate message detected, skipping');
        return;
      }
      processedMessageIdsRef.current.add(messageId);

      // ✅ Step 1: Add message to room
      setMessagesByRoom((prev) => {
        const roomMessages = prev[messageRoomId] || [];
        
        // Double-check for duplicates in state
        const exists = roomMessages.some(m => m._id === messageId);
        if (exists) {
          console.log('[Chat] ⚠️ Message already in state, skipping');
          return prev;
        }

        console.log('[Chat] ✅ Adding message to room:', messageRoomId);
        return {
          ...prev,
          [messageRoomId]: [...roomMessages, message],
        };
      });

      // ✅ Step 2: Update sidebar room info (lastMessage, lastMessageAt)
      setRooms((prev) => {
        const updated = prev.map((room) => {
          if (room._id === messageRoomId) {
            return {
              ...room,
              lastMessage: message.content,
              lastMessageAt: message.createdAt || new Date().toISOString(),
            };
          }
          return room;
        });

        // ✅ Sort rooms by lastMessageAt (most recent on top)
        return updated.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
      });

      // ✅ Step 3: Handle unseen count and mark as seen logic
      // Convert senderId to string for comparison (backend sends ObjectId)
      const messageSenderId = typeof message.senderId === 'string' 
        ? message.senderId 
        : message.senderId?.toString?.() || message.senderId?._id?.toString?.() || message.senderId;
      
      const isMessageFromOtherUser = messageSenderId !== currentUserId;
      
      if (isMessageFromOtherUser) {
        const currentActiveRoom = activeRoomIdRef.current;
        const isPageVisible = isPageVisibleRef.current;
        const isUserViewingThisChat = messageRoomId === currentActiveRoom && isPageVisible;

        console.log('[Chat] 📊 Message from other user:', {
          messageRoomId,
          currentActiveRoom,
          isPageVisible,
          isUserViewingThisChat,
        });

        if (isUserViewingThisChat) {
          // 🔹 Case 1: User is viewing this chat - mark as seen immediately
          console.log('[Chat] ✅ User is viewing this chat, marking as seen');
          newSocket.emit('chat:mark_seen', { roomId: messageRoomId });
        } else {
          // 🔹 Case 2: User is NOT viewing this chat - increment unseen count
          console.log('[Chat] 📬 User is NOT viewing, incrementing unseen count');
          setUnseenCounts((prev) => ({
            ...prev,
            [messageRoomId]: (prev[messageRoomId] || 0) + 1,
          }));
        }
      } else {
        console.log('[Chat] ℹ️ Message is from current user, no unseen action needed');
      }
    });

    // ========================================
    // MESSAGE SEEN STATUS UPDATE
    // ========================================
    newSocket.on('chat:message_seen', (data) => {
      console.log('[Chat] 👁️ Message seen by:', data);
      
      const seenByUserId = data.seenBy?.toString();
      const seenRoomId = data.roomId?.toString();

      setMessagesByRoom((prev) => {
        const updated: Record<string, any[]> = {};
        
        for (const [roomId, messages] of Object.entries(prev)) {
          if (roomId === seenRoomId) {
            updated[roomId] = messages.map((msg) => {
              // Convert senderId to string for comparison
              const msgSenderId = typeof msg.senderId === 'string'
                ? msg.senderId
                : msg.senderId?.toString?.() || msg.senderId;
              
              // Only update messages sent by current user
              if (msgSenderId === currentUserId) {
                const seenByIds = (msg.seenBy || []).map((id: any) => 
                  id?.toString?.() || id
                );
                
                // Add seenByUserId if not already in array
                if (!seenByIds.includes(seenByUserId)) {
                  return {
                    ...msg,
                    seenBy: [...(msg.seenBy || []), seenByUserId],
                  };
                }
              }
              return msg;
            });
          } else {
            updated[roomId] = messages;
          }
        }
        
        return updated;
      });
    });

    // ========================================
    // TYPING STATUS
    // ========================================
    newSocket.on('chat:typing_status', (data) => {
      console.log('[Chat] ⌨️ Typing status:', data);
      // You can implement typing indicator UI here if needed
    });

    // ========================================
    // ERROR HANDLING
    // ========================================
    newSocket.on('error', (err) => {
      console.error('[Chat] ❌ Socket error:', err);
    });

    setSocket(newSocket);

    return () => {
      console.log('[Chat] 🔌 Disconnecting socket and leaving all rooms');
      
      // Leave all rooms before disconnecting
      rooms.forEach((room) => {
        newSocket.emit('chat:leave', { roomId: room._id });
      });
      
      newSocket.disconnect();
    };
  }, [currentUserId]); // ✅ rooms is NOT a dependency to avoid infinite loops

  // ========================================
  // TRACK PAGE VISIBILITY
  // ========================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasVisible = isPageVisibleRef.current;
      isPageVisibleRef.current = !document.hidden;

      console.log('[Chat] 👁️ Page visibility changed:', {
        wasVisible,
        nowVisible: isPageVisibleRef.current,
        activeRoom: activeRoomIdRef.current,
      });

      // If page becomes visible and user has active room, mark unseen messages as seen
      if (!wasVisible && isPageVisibleRef.current && activeRoomIdRef.current && socket) {
        const roomId = activeRoomIdRef.current;
        
        // Check if there are unseen messages in this room
        if (unseenCounts[roomId] > 0) {
          console.log('[Chat] 📖 Page became visible, marking messages as seen');
          socket.emit('chat:mark_seen', { roomId });
          
          // Reset unseen count
          setUnseenCounts((prev) => ({
            ...prev,
            [roomId]: 0,
          }));
        }
      }
    };

    // Set initial visibility
    isPageVisibleRef.current = !document.hidden;

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isPageVisibleRef.current = false;
    };
  }, [socket, unseenCounts]);

  // ========================================
  // SYNC ACTIVE ROOM REF
  // ========================================
  useEffect(() => {
    activeRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // ========================================
  // LOAD ROOMS ON MOUNT
  // ========================================
  useEffect(() => {
    if (!currentUserId || !socket) return;

    const loadRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const data = await chatService.listRooms();
        
        // Sort rooms by lastMessageAt (most recent first)
        const sortedRooms = data.sort((a: any, b: any) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setRooms(sortedRooms);

        // ✅ CRITICAL FIX: Join ALL room sockets so user receives messages from all chats
        console.log('[Chat] 🚪 Joining ALL user rooms via socket');
        for (const room of sortedRooms) {
          socket.emit('chat:join', { roomId: room._id });
          console.log(`[Chat] ✅ Joined room: ${room._id}`);
        }

        // Calculate initial unseen counts
        const counts: Record<string, number> = {};
        for (const room of sortedRooms) {
          try {
            const messagesData = await chatService.listMessages(room._id, 1, 100);
            const unseenCount = (messagesData.messages || []).filter((msg: any) => {
              // Convert senderId to string for comparison
              const msgSenderId = typeof msg.senderId === 'string'
                ? msg.senderId
                : msg.senderId?.toString?.() || msg.senderId;
              
              if (msgSenderId === currentUserId) return false;
              
              const seenByIds = (msg.seenBy || []).map((id: any) =>
                id?.toString?.() || id
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
  }, [currentUserId, socket]); // ✅ Add socket as dependency

  // ========================================
  // LOAD MESSAGES FOR SELECTED ROOM
  // ========================================
  useEffect(() => {
    if (!selectedRoomId || !currentUserId) return;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        console.log('[Chat] 📂 Loading messages for room:', selectedRoomId);

        const data = await chatService.listMessages(selectedRoomId, 1, 50);
        setMessagesByRoom((prev) => ({
          ...prev,
          [selectedRoomId]: data.messages || [],
        }));

        // ✅ NOTE: We already joined ALL rooms on mount, so no need to join again here
        // But we keep this for safety in case user opens a room before rooms are loaded
        if (socket) {
          console.log('[Chat] 🔄 Ensuring user is in room:', selectedRoomId);
          socket.emit('chat:join', { roomId: selectedRoomId });
        }

        // Check for unseen messages
        const unseenMessages = (data.messages || []).filter((msg: any) => {
          // Convert senderId to string for comparison
          const msgSenderId = typeof msg.senderId === 'string'
            ? msg.senderId
            : msg.senderId?.toString?.() || msg.senderId;
          
          if (msgSenderId === currentUserId) return false;
          
          const seenByIds = (msg.seenBy || []).map((id: any) =>
            id?.toString?.() || id
          );
          
          return !seenByIds.includes(currentUserId);
        });

        const hasUnseen = unseenMessages.length > 0;

        console.log('[Chat] 📊 Loaded messages:', {
          total: data.messages?.length || 0,
          unseenCount: unseenMessages.length,
          willMarkSeen: hasUnseen && !!socket,
        });

        // 🔹 Case 3: User clicked on chat - mark existing unseen messages as seen
        if (hasUnseen && socket) {
          console.log('[Chat] ✅ Marking existing messages as seen (user opened chat)');
          socket.emit('chat:mark_seen', { roomId: selectedRoomId });
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

    // ✅ NOTE: We don't leave the room anymore since user needs to stay in ALL rooms
    // This ensures they receive messages from all chats in real-time
  }, [selectedRoomId, currentUserId, socket]);

  // ========================================
  // SEND MESSAGE
  // ========================================
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

  // ========================================
  // RENDER
  // ========================================
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