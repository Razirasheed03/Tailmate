# Chat Feature Testing Guide

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB connected
- Two test user accounts created

## Setup for Testing

### 1. Create Test Users
- Sign up as User A (e.g., "alice@test.com")
- Sign up as User B (e.g., "bob@test.com")

### 2. Create a Matchmaking Listing (as User A)
1. Log in as User A
2. Navigate to `/matchmaking` or profile → matchmaking
3. Create a new listing with:
   - Pet selection
   - Title: "Looking for a match"
   - Description: "Test listing for chat"
   - Location
   - Contact info
   - Photos (optional)
4. Save the listing

## Testing Workflow

### Test 1: Start Chat from Listing Detail
1. Log out or open incognito window
2. Log in as User B
3. Navigate to `/matchmaking` (public listings)
4. Click on User A's listing
5. Click "💬 Chat with Owner" button
6. **Expected**: Redirected to `/chat?room=<roomId>`
7. **Verify**: Chat room created in MongoDB

### Test 2: Send and Receive Messages
1. User B (in chat): Type "Hello from User B" and send
2. **Expected**: Message appears in chat window
3. **Verify**: Message stored in MongoDB
4. In another window/incognito, log in as User A
5. Navigate to `/chat`
6. **Expected**: See User B's room in sidebar
7. Click on the room
8. **Expected**: See User B's message
9. User A: Type "Hello from User A" and send
10. **Expected**: Message appears for both users in real-time

### Test 3: Real-Time Socket.IO
1. Open chat in two browser windows (User A and User B)
2. User A sends: "Testing real-time"
3. **Expected**: Message appears instantly in User B's window (no refresh needed)
4. User B sends: "Got it!"
5. **Expected**: Message appears instantly in User A's window

### Test 4: Message Timestamps
1. Send a message
2. **Expected**: Shows relative time (e.g., "a few seconds ago")
3. Wait 1 minute
4. Refresh page
5. **Expected**: Timestamp updates (e.g., "a minute ago")

### Test 5: Chat Room List
1. User A navigates to `/chat`
2. **Expected**: Sidebar shows room with User B
3. **Expected**: Shows last message preview
4. **Expected**: Shows relative timestamp of last message
5. Send another message
6. **Expected**: Room moves to top of list
7. **Expected**: Last message updates

### Test 6: Message Pagination
1. Send 30+ messages in a room
2. Refresh page
3. **Expected**: Latest 20 messages load
4. Scroll up in message area
5. **Expected**: Older messages load (pagination working)

### Test 7: Mark as Seen
1. User A sends message to User B
2. User B opens chat room
3. **Expected**: Message marked as seen
4. Check MongoDB: `seenBy` array should include User B's ID

### Test 8: Typing Indicators (Optional)
1. User A starts typing
2. **Expected**: Typing indicator visible to User B (if UI implemented)
3. User A stops typing
4. **Expected**: Typing indicator disappears

### Test 9: Authorization
1. Get a room ID from your chat
2. Try to access `/chat/messages/<roomId>` with a different user
3. **Expected**: 403 Forbidden error (unauthorized)

### Test 10: Error Handling
1. Try to send empty message
2. **Expected**: Error message or disabled send button
3. Try to access non-existent room
4. **Expected**: 404 error

## Database Verification

### Check ChatRoom Collection
```javascript
db.chatrooms.find({}).pretty()
```
Expected fields:
- `_id`: ObjectId
- `listingId`: ObjectId (ref to MatchmakingListing)
- `users`: [ObjectId, ObjectId] (2 users, sorted)
- `lastMessage`: string
- `lastMessageAt`: Date
- `createdAt`, `updatedAt`: Date

### Check Message Collection
```javascript
db.messages.find({}).pretty()
```
Expected fields:
- `_id`: ObjectId
- `roomId`: ObjectId (ref to ChatRoom)
- `senderId`: ObjectId
- `content`: string
- `type`: "text"
- `seenBy`: [ObjectId, ...]
- `createdAt`, `updatedAt`: Date

## API Testing with cURL/Postman

### Start Chat
```bash
curl -X POST http://localhost:5000/api/chat/start \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"<LISTING_ID>","receiverId":"<USER_B_ID>"}'
```

### List Rooms
```bash
curl -X GET http://localhost:5000/api/chat/rooms \
  -H "Authorization: Bearer <TOKEN>"
```

### Get Messages
```bash
curl -X GET "http://localhost:5000/api/chat/messages/<ROOM_ID>?page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/chat/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"<ROOM_ID>","content":"Hello!"}'
```

### Mark Seen
```bash
curl -X POST http://localhost:5000/api/chat/seen/<ROOM_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

## Socket.IO Testing

### Connect to Socket.IO
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Connected'));
```

### Join Room
```javascript
socket.emit('join_room', 'ROOM_ID');
socket.on('joined_room', (data) => console.log('Joined:', data));
```

### Send Message
```javascript
socket.emit('send_message', {
  roomId: 'ROOM_ID',
  content: 'Hello via socket!'
});

socket.on('receive_message', (message) => console.log('Received:', message));
```

### Typing
```javascript
socket.emit('typing', { roomId: 'ROOM_ID' });
socket.on('typing_status', (data) => console.log('Typing:', data));

socket.emit('stop_typing', { roomId: 'ROOM_ID' });
```

### Mark Seen
```javascript
socket.emit('mark_seen', { roomId: 'ROOM_ID' });
socket.on('message_seen', (data) => console.log('Seen by:', data));
```

## Common Issues & Troubleshooting

### Issue: "Unauthorized" error
**Solution**: Ensure JWT token is valid and not expired. Check localStorage for `auth_token`.

### Issue: Socket.IO not connecting
**Solution**: 
- Check backend is running on correct port
- Verify CORS settings in server.ts
- Check browser console for errors

### Issue: Messages not appearing in real-time
**Solution**:
- Verify Socket.IO connection is established
- Check that both users are in the same room
- Verify message was sent (check HTTP response)

### Issue: Chat room not created
**Solution**:
- Verify listing exists and is not deleted
- Ensure receiverId is valid user ID
- Check MongoDB connection

### Issue: "Cannot read property 'users'"
**Solution**: This is a TypeScript type issue. The code uses `(room as any).users` to bypass strict typing. Ensure room object is returned from repository.

## Performance Testing

### Load Test: Send 100 messages
1. Use a script to send 100 messages rapidly
2. **Expected**: All messages stored and delivered
3. **Expected**: No crashes or timeouts

### Concurrent Users
1. Open chat in 5 browser windows
2. Send messages from each
3. **Expected**: All messages delivered to all users
4. **Expected**: No race conditions

## Cleanup

After testing, you can clear test data:

```javascript
// Clear test rooms and messages
db.chatrooms.deleteMany({ /* filter */ });
db.messages.deleteMany({ /* filter */ });
```

## Success Criteria

✅ Chat room created on first message  
✅ Messages sent and received in real-time  
✅ Messages persisted in MongoDB  
✅ Authorization checks working  
✅ Pagination working for message history  
✅ Timestamps displaying correctly  
✅ UI responsive on mobile  
✅ No console errors  
✅ Socket.IO connecting successfully  
✅ Error handling working  
