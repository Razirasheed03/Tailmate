# WebRTC Debugging Guide - Offer Not Reaching Patient

## Current Status

**Doctor Side:**
- ✅ Socket connects to `/consultation` namespace
- ✅ Joins room successfully
- ✅ Creates offer
- ✅ Emits `webrtc:offer` event
- ❌ **Patient never receives it**

**Patient Side:**
- ✅ Socket connects to `/consultation` namespace
- ✅ Joins room successfully
- ✅ Listening for `webrtc:offer` event
- ❌ **Never receives the offer**

## Root Cause Analysis

### Possible Issues

1. **Socket.IO Room Broadcasting Not Working**
   - Doctor joins room: `socket.join(videoRoomId)`
   - Doctor emits: `socket.to(videoRoomId).emit('webrtc:offer', ...)`
   - Patient should receive it if in same room
   - **Check**: Are both sockets actually in the same room?

2. **Event Name Mismatch**
   - Backend listening: `socket.on("webrtc:offer", ...)`
   - Frontend emitting: `socketRef.current?.emit('webrtc:offer', ...)`
   - **Status**: ✅ Names match

3. **Socket Connection Issues**
   - Frontend connects to: `io(${backendUrl}/consultation, ...)`
   - Backend listens on: `io.of("/consultation")`
   - **Status**: ✅ Both on same namespace

4. **Room Join Not Working**
   - Doctor: `socket.join(videoRoomId)` ✅
   - Patient: `socket.join(videoRoomId)` ✅
   - **Check**: Are they joining the SAME room?

## Debug Checklist

### 1. Verify Socket Connections

**Frontend Logs Should Show:**
```
[SOCKET DEBUG] Connecting to: http://localhost:4000/consultation
[WebRTC] ✅ Socket connected (DOCTOR): <socket-id>
[WebRTC] ✅ Socket connected (PATIENT): <socket-id>
```

**Backend Logs Should Show:**
```
[WebRTC] ✅ Consultation namespace created at /consultation
[WebRTC] 🔌 New socket connected to /consultation: <doctor-socket-id>
[WebRTC] ✅ Socket authenticated for user: <doctor-user-id>
[WebRTC] 🔌 New socket connected to /consultation: <patient-socket-id>
[WebRTC] ✅ Socket authenticated for user: <patient-user-id>
```

### 2. Verify Room Joins

**Frontend Logs Should Show:**
```
[WebRTC] ✅ Successfully joined room
```

**Backend Logs Should Show:**
```
[WebRTC] ✅ User <doctor-id> (DOCTOR) joined room <room-id>
[WebRTC] ✅ User <patient-id> (PATIENT) joined room <room-id>
```

**CRITICAL**: Both should show the SAME `<room-id>`

### 3. Verify Offer Emission

**Frontend (Doctor) Logs Should Show:**
```
[WebRTC] Doctor creating offer...
[WebRTC] Offer created and sent
```

**Backend Logs Should Show:**
```
[WebRTC] 📥 Received webrtc:offer event
[WebRTC] Socket ID: <doctor-socket-id>
[WebRTC] Socket rooms: Set { '<room-id>' }
[WebRTC] Data: { videoRoomId: '<room-id>', hasOffer: true }
[WebRTC] 📤 User <doctor-id> sending OFFER to room <room-id>
[WebRTC] Broadcasting to room: <room-id>
[WebRTC] ✅ Offer forwarded to room <room-id>
```

### 4. Verify Offer Reception

**Frontend (Patient) Logs Should Show:**
```
[WebRTC] 📥 Received offer from doctor
[WebRTC] Offer data: { fromUserId: '<doctor-id>', hasOffer: true }
[WebRTC] Setting remote description (offer)
[WebRTC] Creating answer...
[WebRTC] Answer created and sent
```

## Testing Steps

### Step 1: Clear Database
```bash
# In MongoDB
db.consultations.deleteMany({})
```

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

Look for:
```
[SERVER DEBUG] Namespaces created: [ '/', '/consultation' ]
[SERVER DEBUG] Consultation namespace exists: true
[WebRTC] ✅ Consultation namespace created at /consultation
```

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Doctor Initiates Call
1. Login as doctor
2. Go to SessionDetail
3. Click "Start Video Call"
4. **Check Console Logs** for:
   - Socket connection to `/consultation`
   - Room join
   - Offer creation and emission

### Step 5: Patient Joins Call
1. Login as patient
2. Go to Bookings
3. Click "Join Call"
4. **Check Console Logs** for:
   - Socket connection to `/consultation`
   - Room join
   - **CRITICAL**: Does patient receive offer?

## Expected Console Output

### Doctor Console (Complete Flow)
```
[SOCKET DEBUG] Connecting to: http://localhost:4000/consultation
[SOCKET DEBUG] Token present: true
[WebRTC] ✅ Socket connected (DOCTOR): UL46fW6n4GCLMo4LAAAD
[SOCKET DEBUG] Connected! Socket ID: UL46fW6n4GCLMo4LAAAD
[SOCKET DEBUG] Transport: websocket
[WebRTC] ✅ Successfully joined room
[WebRTC] Starting call as DOCTOR
[WebRTC] Requesting user media...
[WebRTC] ✅ Got local media: (2) ['audio', 'video']
[WebRTC] Creating new peer connection
[WebRTC] Adding local tracks to peer connection
[WebRTC] Doctor creating offer...
[WebRTC] Offer created and sent
```

### Backend Logs (Complete Flow)
```
[WebRTC] 🔌 New socket connected to /consultation: UL46fW6n4GCLMo4LAAAD
[WebRTC] Socket namespace: /consultation
[WebRTC] Socket rooms: Set { }
[WebRTC] ✅ Socket authenticated for user: 689f6cf6624be92d797bcda5
[WebRTC] ✅ User 689f6cf6624be92d797bcda5 (DOCTOR) joined room room_ydn3k78umzk8
[WebRTC] 📥 Received webrtc:offer event
[WebRTC] Socket ID: UL46fW6n4GCLMo4LAAAD
[WebRTC] Socket rooms: Set { 'room_ydn3k78umzk8' }
[WebRTC] Data: { videoRoomId: 'room_ydn3k78umzk8', hasOffer: true }
[WebRTC] 📤 User 689f6cf6624be92d797bcda5 sending OFFER to room room_ydn3k78umzk8
[WebRTC] Broadcasting to room: room_ydn3k78umzk8
[WebRTC] ✅ Offer forwarded to room room_ydn3k78umzk8
```

### Patient Console (Complete Flow)
```
[SOCKET DEBUG] Connecting to: http://localhost:4000/consultation
[SOCKET DEBUG] Token present: true
[WebRTC] ✅ Socket connected (PATIENT): vbdFd_uNq9RAZC4YAAAH
[SOCKET DEBUG] Connected! Socket ID: vbdFd_uNq9RAZC4YAAAH
[SOCKET DEBUG] Transport: websocket
[WebRTC] ✅ Successfully joined room
[WebRTC] Starting call as PATIENT
[WebRTC] Requesting user media...
[WebRTC] ✅ Got local media: (2) ['audio', 'video']
[WebRTC] Creating new peer connection
[WebRTC] Adding local tracks to peer connection
[WebRTC] Patient ready - waiting for doctor's offer
[WebRTC] 📥 Received offer from doctor  ← CRITICAL LINE
[WebRTC] Offer data: { fromUserId: '689f6cf6624be92d797bcda5', hasOffer: true }
[WebRTC] Setting remote description (offer)
[WebRTC] Creating answer...
[WebRTC] Answer created and sent
```

## If Offer Not Reaching Patient

### Check 1: Are Both in Same Room?

**Backend should show:**
```
[WebRTC] ✅ User 689f6cf6624be92d797bcda5 (DOCTOR) joined room room_ydn3k78umzk8
[WebRTC] ✅ User 68a07e4beff830fcbc58c6ab (PATIENT) joined room room_ydn3k78umzk8
```

If room IDs are different → **CRITICAL BUG**: Both calling prepareCall and getting different rooms

### Check 2: Is Backend Receiving Offer?

**Backend should show:**
```
[WebRTC] 📥 Received webrtc:offer event
```

If NOT showing → Frontend not emitting, or event name mismatch

### Check 3: Is Backend Broadcasting?

**Backend should show:**
```
[WebRTC] Broadcasting to room: room_ydn3k78umzk8
[WebRTC] ✅ Offer forwarded to room room_ydn3k78umzk8
```

If NOT showing → Backend received offer but didn't broadcast

### Check 4: Is Patient Listening?

**Frontend should have:**
```typescript
socketRef.current.on('webrtc:offer', handleOffer);
```

If event name is wrong → Patient won't receive

## Nuclear Option: Add More Logging

### Backend - Add to offer handler:
```typescript
console.log("[WebRTC] All sockets in namespace:", consultationNamespace.sockets.size);
console.log("[WebRTC] Sockets in room:", consultationNamespace.in(data.videoRoomId).sockets.size);
```

### Frontend - Add to socket setup:
```typescript
socketRef.current.on('webrtc:offer', (data) => {
  console.log('[WebRTC] OFFER RECEIVED!', data);
});
```

## Summary

The issue is that **doctor's offer is being emitted but patient never receives it**.

Possible causes:
1. ❓ Both not in same room
2. ❓ Backend not broadcasting to room
3. ❓ Patient not listening for event
4. ❓ Event name mismatch

**Next Step**: Run the test and check the console logs against the expected output above.
