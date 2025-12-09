# Socket Architecture Fix - Verification Guide

## What Was Fixed

### Problem
Doctor and patient were connecting to DIFFERENT socket namespaces:
- Frontend: Both connected to root "/" namespace
- Backend: WebRTC handlers on "/consultation" namespace
- Result: WebRTC signaling never reached the other party

### Solution
Moved WebRTC handlers from "/consultation" namespace to root "/" namespace.
Updated all event names to use "webrtc:" prefix for clarity.

## Files Modified

### Backend Changes

**1. backend/src/sockets/webrtc.consultation.ts**
```
OLD: const consultationNamespace = io.of("/consultation");
     consultationNamespace.on("connection", ...);

NEW: io.on("connection", ...);  // Root namespace
```

**Event Name Changes:**
```
join_consultation_room  → webrtc:join_room
webrtc_offer           → webrtc:offer
webrtc_answer          → webrtc:answer
webrtc_ice_candidate   → webrtc:ice_candidate
```

### Frontend Changes

**1. frontend/src/hooks/useConsultationWebRTC.ts**
```
socketRef.current?.emit('webrtc:join_room', {...});
socketRef.current?.emit('webrtc:offer', {...});
socketRef.current?.emit('webrtc:answer', {...});
socketRef.current?.emit('webrtc:ice_candidate', {...});

socketRef.current.on('webrtc:offer', handleOffer);
socketRef.current.on('webrtc:answer', handleAnswer);
socketRef.current.on('webrtc:ice_candidate', handleIceCandidate);
```

## Testing Checklist

### 1. Backend Socket Setup
```bash
npm run dev  # Start backend
# Look for logs:
[WebRTC] ✅ WebRTC handlers registered on root namespace
```

### 2. Frontend Socket Connection
```
Doctor:
  [WebRTC] Initializing socket for DOCTOR
  [WebRTC] ✅ Socket connected (DOCTOR): <socket-id>
  [WebRTC] ✅ Successfully joined room

Patient:
  [WebRTC] Initializing socket for PATIENT
  [WebRTC] ✅ Socket connected (PATIENT): <socket-id>
  [WebRTC] ✅ Successfully joined room
```

### 3. Verify Same Namespace
```
✅ Both doctor and patient connect to root "/" namespace
✅ Both can receive events from each other
✅ No "namespace not found" errors
```

### 4. WebRTC Signaling Flow

**Doctor Side:**
```
1. Doctor clicks "Start Call"
2. [WebRTC] Doctor creating offer...
3. [WebRTC] Offer created and sent
4. [WebRTC] 📤 User <doctorId> sending OFFER to room <roomId>
5. [WebRTC] ✅ Offer forwarded to room <roomId>
6. Wait for patient's answer...
```

**Patient Side:**
```
1. Patient joins call
2. [WebRTC] Patient ready - waiting for doctor's offer
3. [WebRTC] 📥 Received offer from doctor
4. [WebRTC] Setting remote description (offer)
5. [WebRTC] Creating answer...
6. [WebRTC] Answer created and sent
7. [WebRTC] 📤 User <patientId> sending ANSWER to room <roomId>
8. [WebRTC] ✅ Answer forwarded to room <roomId>
```

**Doctor Receives Answer:**
```
1. [WebRTC] 📥 Received answer from patient
2. [WebRTC] Setting remote description (answer)
3. [WebRTC] ✅ Connection established
```

### 5. ICE Candidate Exchange
```
Doctor sends ICE:
  [WebRTC] 📤 User <doctorId> sending ICE candidate to room <roomId>

Patient sends ICE:
  [WebRTC] 📤 User <patientId> sending ICE candidate to room <roomId>

Both receive:
  [WebRTC] Adding ICE candidate from: <userId>
```

### 6. Video Connection
```
✅ Doctor sees own video
✅ Doctor sees patient's video
✅ Patient sees own video
✅ Patient sees doctor's video
✅ Audio works both ways
```

## Complete Flow Test

### Step 1: Start Backend
```bash
cd backend
npm run dev
```
Expected: `[WebRTC] ✅ WebRTC handlers registered on root namespace`

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Doctor Initiates Call
1. Login as doctor
2. Go to SessionDetail
3. Click "Start Video Call"
4. Check console logs:
   - Socket connects
   - Joins room
   - Creates offer
   - Offer sent

### Step 4: Patient Joins Call
1. Login as patient
2. Go to Bookings
3. Click "Join Call"
4. Check console logs:
   - Socket connects
   - Joins room
   - Receives offer
   - Creates answer
   - Answer sent

### Step 5: Verify Connection
1. Doctor should see patient's video
2. Patient should see doctor's video
3. Both should hear each other
4. No errors in console

## Debugging Tips

### If Doctor's Offer Not Reaching Patient

**Check:**
1. Both connected to same namespace (root "/")
   ```
   Doctor: [WebRTC] ✅ Socket connected (DOCTOR): <id>
   Patient: [WebRTC] ✅ Socket connected (PATIENT): <id>
   ```

2. Both joined same room
   ```
   Doctor: [WebRTC] ✅ Successfully joined room
   Patient: [WebRTC] ✅ Successfully joined room
   ```

3. Event name is correct
   ```
   Backend: socket.to(videoRoomId).emit("webrtc:offer", ...)
   Frontend: socketRef.current.on('webrtc:offer', handleOffer)
   ```

### If ICE Candidates Not Exchanged

**Check:**
1. Peer connection created
   ```
   [WebRTC] Creating new peer connection
   [WebRTC] Adding local tracks to peer connection
   ```

2. ICE event name correct
   ```
   Backend: emit("webrtc:ice_candidate", ...)
   Frontend: on('webrtc:ice_candidate', handleIceCandidate)
   ```

### If Socket Disconnects

**Check:**
1. Token is valid
   ```
   [WebRTC] ✅ Socket authenticated for user: <userId>
   ```

2. No auth errors
   ```
   [WebRTC] ❌ Socket auth failed: <error>  ← This would indicate problem
   ```

## Expected Console Output

### Doctor Console
```
[WebRTC] Initializing socket for DOCTOR
[WebRTC] ✅ Socket connected (DOCTOR): oKRin1X2rFDYHKyOAAAG
[WebRTC] ✅ Successfully joined room
[WebRTC] Starting call as DOCTOR
[WebRTC] Requesting user media...
[WebRTC] ✅ Got local media: (2) ['audio', 'video']
[WebRTC] Creating new peer connection
[WebRTC] Adding local tracks to peer connection
[WebRTC] Doctor creating offer...
[WebRTC] Offer created and sent
[WebRTC] 📤 User 689f6cf6624be92d797bcda5 sending OFFER to room room_sfrjen8bz6fh
[WebRTC] ✅ Offer forwarded to room room_sfrjen8bz6fh
[WebRTC] 📥 Received answer from patient
[WebRTC] Setting remote description (answer)
[WebRTC] ✅ Connection established
[WebRTC] ✅ Received remote track: video
[WebRTC] ✅ Peer connection established!
```

### Patient Console
```
[WebRTC] Initializing socket for PATIENT
[WebRTC] ✅ Socket connected (PATIENT): 2gNzyZwEZvSuckfGAAAJ
[WebRTC] ✅ Successfully joined room
[WebRTC] Starting call as PATIENT
[WebRTC] Requesting user media...
[WebRTC] ✅ Got local media: (2) ['audio', 'video']
[WebRTC] Creating new peer connection
[WebRTC] Adding local tracks to peer connection
[WebRTC] Patient ready - waiting for doctor's offer
[WebRTC] 📥 Received offer from doctor
[WebRTC] Setting remote description (offer)
[WebRTC] Creating answer...
[WebRTC] Answer created and sent
[WebRTC] 📤 User 68a07e4beff830fcbc58c6ab sending ANSWER to room room_sfrjen8bz6fh
[WebRTC] ✅ Answer forwarded to room room_sfrjen8bz6fh
[WebRTC] ✅ Received remote track: video
[WebRTC] ✅ Peer connection established!
```

## Success Criteria

✅ Doctor and patient connect to SAME namespace
✅ Doctor's offer reaches patient
✅ Patient's answer reaches doctor
✅ ICE candidates exchanged
✅ Both see video
✅ Both hear audio
✅ No socket errors
✅ No namespace errors
✅ Single socket connection per user
