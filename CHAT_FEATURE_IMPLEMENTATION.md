# Real-Time Chat Feature for Matchmaking - Implementation Summary

## Overview
A complete real-time chat system for matchmaking listings, allowing listing owners and interested users to communicate via Socket.IO with persistent message storage in MongoDB.

## Backend Implementation

### 1. Database Schemas

#### ChatRoom Schema (`src/schema/chatRoom.schema.ts`)
- **listingId**: Reference to MatchmakingListing
- **users**: Array of exactly 2 user ObjectIds (sorted for uniqueness)
- **lastMessage**: Last message text
- **lastMessageAt**: Timestamp of last message
- **Unique Index**: `{ listingId, users }` ensures one room per listing + user pair
- **Timestamps**: createdAt, updatedAt

#### Message Schema (`src/schema/message.schema.ts`)
- **roomId**: Reference to ChatRoom
- **senderId**: User who sent the message
- **content**: Message text
- **type**: "text" (extensible for future types)
- **seenBy**: Array of user IDs who have seen the message
- **Timestamps**: createdAt, updatedAt

### 2. Repositories

#### ChatRepository (`src/repositories/implements/chat.repository.ts`)
Methods:
- `findOrCreateRoom(listingId, userId1, userId2)` - Gets or creates a room
- `findRoomById(roomId)` - Fetches room details
- `listRoomsByUser(userId)` - Lists all rooms for a user (sorted by lastMessageAt)
- `updateLastMessage(roomId, message)` - Updates room's last message

#### MessageRepository (`src/repositories/implements/message.repository.ts`)
Methods:
- `create(roomId, senderId, content)` - Creates a message, marks sender as seen
- `listByRoom(roomId, page, limit)` - Paginated message history
- `markSeen(roomId, userId)` - Marks all unseen messages as seen by user
- `findById(messageId)` - Fetches single message

### 3. Service Layer

#### ChatService (`src/services/implements/chat.service.ts`)
Methods:
- `startChat(currentUserId, listingId, receiverId)` - Initiates or retrieves chat room
  - Validates listing exists
  - Ensures user is either owner or receiver
  - Returns room (creates if doesn't exist)
- `listRooms(currentUserId)` - Gets all rooms for user
- `listMessages(currentUserId, roomId, page, limit)` - Fetches paginated messages
  - Verifies user is in room
- `sendMessage(currentUserId, roomId, content)` - Sends message
  - Validates content
  - Verifies user is in room
  - Updates room's lastMessage
- `markSeen(currentUserId, roomId)` - Marks messages as seen
  - Verifies user is in room

### 4. Controller

#### ChatController (`src/controllers/Implements/chat.controller.ts`)
Endpoints:
- `POST /chat/start` - Start/get chat room
- `GET /chat/rooms` - List user's chat rooms
- `GET /chat/messages/:roomId` - Get messages (paginated)
- `POST /chat/send` - Send message
- `POST /chat/seen/:roomId` - Mark room as seen

All endpoints use `ResponseHelper` and `asyncHandler` following existing patterns.

### 5. Routes

#### Chat Routes (`src/routes/chat.route.ts`)
- Protected with `authJwt` middleware
- All endpoints wrapped with `asyncHandler`
- Mounted at `/api/chat` in main app

### 6. Socket.IO Integration

#### Chat Socket Handler (`src/sockets/chat.socket.ts`)
Events:
- **join_room** - User joins a chat room
- **send_message** - Send message (broadcasts to room)
- **typing** - Typing indicator (broadcasts to room)
- **stop_typing** - Stop typing indicator
- **mark_seen** - Mark messages as seen (broadcasts to room)
- **leave_room** - Leave a room

Features:
- JWT authentication from token in handshake
- Real-time message broadcasting
- Typing indicators
- Message seen status

Integrated into `src/server.ts` via `setupChatSocket(io)`.

---

## Frontend Implementation

### 1. Chat Service (`src/services/chatService.ts`)
Methods:
- `startChat(listingId, receiverId)` - Initiate chat
- `listRooms()` - Get all rooms
- `listMessages(roomId, page, limit)` - Fetch messages
- `sendMessage(roomId, content)` - Send message
- `markSeen(roomId)` - Mark as seen

All use `httpClient` with Bearer token auth.

### 2. Components

#### MessageBubble (`src/components/chat/MessageBubble.tsx`)
- Displays individual message
- Shows sender's message on right (orange), receiver's on left (gray)
- Relative timestamp using dayjs
- Rounded corners with distinct styling

#### ChatInput (`src/components/chat/ChatInput.tsx`)
- Textarea with Enter-to-send (Shift+Enter for newline)
- Send button with loading state
- Disabled when loading or empty

#### ChatWindow (`src/components/chat/ChatWindow.tsx`)
- Main chat area
- Auto-scrolls to latest message
- Shows "No messages" placeholder
- Header with room info
- Integrates ChatInput
- Loading indicator

#### ChatSidebar (`src/components/chat/ChatSidebar.tsx`)
- Lists all chat rooms
- Shows last message preview
- Relative timestamp for each room
- Highlights selected room
- Loading state

### 3. Main Chat Page (`src/pages/chat/ChatPage.tsx`)
Features:
- Socket.IO connection with JWT auth
- Real-time message receiving
- Auto-join room on selection
- Auto-mark-seen on room open
- Fallback to HTTP if Socket fails
- Responsive layout (sidebar + window)
- Loads rooms on mount
- Auto-selects first room if none specified

### 4. Route Integration
- Added `/chat` route in `AppRoutes.tsx`
- Protected with `ProtectedRoute` (user role only)
- Supports query param `?room=<roomId>` for deep linking

### 5. MatchmakingDetail Integration
- Added "Chat with Owner" button
- Calls `chatService.startChat(listing._id, listing.userId)`
- Navigates to `/chat?room=<roomId>` on success
- Shows loading state during chat creation
- Error toast on failure
- Button hidden for own listings

---

## Architecture Highlights

### Backend
- **No NestJS/Decorators**: Pure Express + TypeScript
- **Layered Architecture**: Controllers → Services → Repositories → Models
- **Error Handling**: Custom error objects with status codes
- **Authorization**: User verification at service level
- **Real-time**: Socket.IO with JWT auth from handshake

### Frontend
- **Service Layer**: Centralized API calls via `chatService`
- **Component Composition**: Reusable, focused components
- **Socket Integration**: Real-time updates with HTTP fallback
- **State Management**: React hooks (useState, useEffect)
- **Responsive Design**: Mobile-first with Tailwind CSS

---

## Key Features

✅ One-to-one chat between listing owner and interested user  
✅ Persistent message storage in MongoDB  
✅ Real-time messaging via Socket.IO  
✅ Message seen status tracking  
✅ Typing indicators  
✅ Paginated message history  
✅ Auto-scroll to latest message  
✅ User authorization checks  
✅ Responsive UI  
✅ Error handling and loading states  

---

## Testing Checklist

- [ ] Create matchmaking listing
- [ ] View listing as different user
- [ ] Click "Chat with Owner"
- [ ] Verify room created
- [ ] Send message from user
- [ ] Verify real-time delivery via Socket.IO
- [ ] Send message from owner
- [ ] Verify both users see messages
- [ ] Check message timestamps
- [ ] Test typing indicators
- [ ] Verify mark-seen functionality
- [ ] Test pagination with many messages
- [ ] Check room list updates
- [ ] Test on mobile (responsive)
- [ ] Verify error handling (invalid room, unauthorized, etc.)

---

## API Endpoints

```
POST   /api/chat/start              - Start/get chat room
GET    /api/chat/rooms              - List user's rooms
GET    /api/chat/messages/:roomId   - Get messages (page, limit)
POST   /api/chat/send               - Send message
POST   /api/chat/seen/:roomId       - Mark as seen
```

All require Bearer token in Authorization header.

---

## Socket.IO Events

**Client → Server:**
- `join_room` → `{ roomId }`
- `send_message` → `{ roomId, content }`
- `typing` → `{ roomId }`
- `stop_typing` → `{ roomId }`
- `mark_seen` → `{ roomId }`
- `leave_room` → `roomId`

**Server → Client:**
- `joined_room` ← `{ roomId, success }`
- `receive_message` ← `{ ...message }`
- `typing_status` ← `{ userId, isTyping }`
- `message_seen` ← `{ userId, roomId }`
- `error` ← `message`

---

## Files Created/Modified

### Backend
- ✅ `src/schema/chatRoom.schema.ts` (NEW)
- ✅ `src/schema/message.schema.ts` (NEW)
- ✅ `src/repositories/implements/chat.repository.ts` (NEW)
- ✅ `src/repositories/implements/message.repository.ts` (NEW)
- ✅ `src/services/implements/chat.service.ts` (NEW)
- ✅ `src/controllers/Implements/chat.controller.ts` (NEW)
- ✅ `src/routes/chat.route.ts` (NEW)
- ✅ `src/sockets/chat.socket.ts` (NEW)
- ✅ `src/repositories/implements/matchmaking.repository.ts` (MODIFIED - added findById)
- ✅ `src/server.ts` (MODIFIED - added chat routes and Socket setup)

### Frontend
- ✅ `src/services/chatService.ts` (NEW)
- ✅ `src/components/chat/MessageBubble.tsx` (NEW)
- ✅ `src/components/chat/ChatInput.tsx` (NEW)
- ✅ `src/components/chat/ChatWindow.tsx` (NEW)
- ✅ `src/components/chat/ChatSidebar.tsx` (NEW)
- ✅ `src/pages/chat/ChatPage.tsx` (NEW)
- ✅ `src/routes/AppRoutes.tsx` (MODIFIED - added /chat route)
- ✅ `src/pages/user/MatchmakingDetail.tsx` (MODIFIED - added Chat button)

---

## Next Steps (Optional Enhancements)

- Add typing indicators UI
- Add message reactions/emoji
- Add image/file sharing
- Add message search
- Add block user functionality
- Add chat notifications
- Add read receipts UI
- Add user online status
- Add message editing/deletion
- Add group chat support
