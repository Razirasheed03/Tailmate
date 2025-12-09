# ICE Candidate Exchange - Debugging & Fix

## Current Issue

**Symptoms:**
- ✅ Doctor's offer reaches patient
- ✅ Patient's answer reaches doctor  
- ❌ **Connection FAILS** - `Connection state: failed`
- ❌ **Doctor's camera goes black** when patient joins

**Root Cause:**
ICE candidates are NOT being exchanged properly between doctor and patient.

## What Are ICE Candidates?

ICE (Interactive Connectivity Establishment) candidates are network addresses that allow two peers to connect directly. Without them:
- Peers can't find each other's IP addresses
- Connection fails even though offer/answer succeeded
- Video/audio won't work

## The Fix Applied

### 1. Frontend Logging Added ✅

**File**: `frontend/src/hooks/useConsultationWebRTC.ts`

Added logging to ICE candidate handler:
```typescript
const handleIceCandidate = async (data: any) => {
  try {
    console.log('[WebRTC] 📥 Received ICE candidate from:', data.fromUserId);
    if (peerConnectionRef.current && data.candidate) {
      console.log('[WebRTC] Adding ICE candidate');
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
      console.log('[WebRTC] ✅ ICE candidate added');
    }
  } catch (error) {
    console.error('[WebRTC] Error adding ICE candidate:', error);
  }
};
```

### 2. Backend Logging Added ✅

**File**: `backend/src/sockets/webrtc.consultation.ts`

Added logging to ICE candidate handler:
```typescript
socket.on("webrtc:ice_candidate", (data) => {
  console.log("[WebRTC] 📥 Received webrtc:ice_candidate event");
  console.log("[WebRTC] ICE candidate data:", { videoRoomId: data.videoRoomId, hasCandidate: !!data.candidate });
  
  if (!userId) {
    console.log("[WebRTC] ❌ ICE candidate rejected - no userId");
    return;
  }

  console.log(`[WebRTC] 📤 User ${userId} sending ICE candidate to room ${data.videoRoomId}`);
  socket.to(data.videoRoomId).emit("webrtc:ice_candidate", {
    fromUserId: userId,
    candidate: data.candidate,
  });
  console.log(`[WebRTC] ✅ ICE candidate forwarded to room ${data.videoRoomId}`);
});
```

### 3. Answer Handler Logging Added ✅

**File**: `backend/src/sockets/webrtc.consultation.ts`

Added logging to answer handler to verify it's being received:
```typescript
socket.on("webrtc:answer", (data) => {
  console.log("[WebRTC] 📥 Received webrtc:answer event");
  console.log("[WebRTC] Answer data:", { videoRoomId: data.videoRoomId, hasAnswer: !!data.answer });
  
  // ... rest of handler
});
```

## Expected Flow

### Doctor Side
```
1. Create offer
2. Set local description (offer)
3. onicecandidate fires
4. Emit webrtc:ice_candidate to backend
5. Backend receives and forwards
6. Patient receives ICE candidate
7. Patient adds ICE candidate
8. Connection established ✅
```

### Patient Side
```
1. Receive offer from doctor
2. Set remote description (offer)
3. Create answer
4. Set local description (answer)
5. Emit webrtc:answer to backend
6. Backend receives and forwards
7. Doctor receives answer
8. Doctor sets remote description (answer)
9. onicecandidate fires
10. Emit webrtc:ice_candidate to backend
11. Backend receives and forwards
12. Patient receives ICE candidate
13. Patient adds ICE candidate
14. Connection established ✅
```

## Expected Console Logs

### Doctor Console
```
[WebRTC] Doctor creating offer...
[WebRTC] Offer created and sent
[WebRTC] 📥 Received offer from doctor  ← Patient receives
[WebRTC] 📥 Received ICE candidate from: <patient-id>
[WebRTC] Adding ICE candidate
[WebRTC] ✅ ICE candidate added
[WebRTC] 📥 Received answer from patient
[WebRTC] Setting remote description (answer)
[WebRTC] ✅ Connection established
```

### Backend Console
```
[WebRTC] 📥 Received webrtc:offer event
[WebRTC] ✅ Offer forwarded to room <room-id>

[WebRTC] 📥 Received webrtc:answer event
[WebRTC] ✅ Answer forwarded to room <room-id>

[WebRTC] 📥 Received webrtc:ice_candidate event
[WebRTC] ICE candidate data: { videoRoomId: '<room-id>', hasCandidate: true }
[WebRTC] ✅ ICE candidate forwarded to room <room-id>
```

### Patient Console
```
[WebRTC] Patient ready - waiting for doctor's offer
[WebRTC] 📥 Received offer from doctor
[WebRTC] Offer data: { fromUserId: '<doctor-id>', hasOffer: true }
[WebRTC] Setting remote description (offer)
[WebRTC] Creating answer...
[WebRTC] Sending answer to doctor
[WebRTC] 📥 Received ICE candidate from: <doctor-id>
[WebRTC] Adding ICE candidate
[WebRTC] ✅ ICE candidate added
[WebRTC] ✅ Received remote track: video
[WebRTC] ✅ Received remote track: audio
```

## Testing Steps

### 1. Clear Database
```bash
db.consultations.deleteMany({})
```

### 2. Restart Backend
```bash
cd backend
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Doctor Initiates Call
1. Login as doctor
2. Go to SessionDetail
3. Click "Start Video Call"
4. **Check console** for:
   - Offer creation
   - No ICE candidate logs yet (patient not connected)

### 5. Patient Joins Call
1. Login as patient
2. Go to Bookings
3. Click "Join Call"
4. **Check console** for:
   - Offer reception
   - Answer creation
   - **CRITICAL**: ICE candidate exchange logs

### 6. Verify Connection
- [ ] Doctor sees patient's video
- [ ] Patient sees doctor's video
- [ ] Both hear audio
- [ ] No "Connection failed" logs
- [ ] Console shows ICE candidate exchange

## Debugging Checklist

### If Connection Still Fails

**Check 1: Are ICE candidates being generated?**
```
Frontend should show:
[WebRTC] 📥 Received ICE candidate from: <user-id>
```

If NOT showing → ICE candidates not being generated or not being sent

**Check 2: Is backend receiving ICE candidates?**
```
Backend should show:
[WebRTC] 📥 Received webrtc:ice_candidate event
```

If NOT showing → Frontend not emitting, or event name mismatch

**Check 3: Is backend forwarding ICE candidates?**
```
Backend should show:
[WebRTC] ✅ ICE candidate forwarded to room <room-id>
```

If NOT showing → Backend received but didn't forward

**Check 4: Is peer connection ready?**
```
Frontend should show:
[WebRTC] Creating new peer connection
[WebRTC] Adding local tracks to peer connection
```

If NOT showing → Peer connection not initialized

## Common Issues

### Issue 1: "Connection state: failed"
**Cause**: ICE candidates not exchanged
**Fix**: Check logs for ICE candidate exchange

### Issue 2: Camera goes black
**Cause**: Connection established but no media flowing
**Fix**: Verify ICE candidates are being added successfully

### Issue 3: "Error adding ICE candidate"
**Cause**: Candidate format wrong or peer connection not ready
**Fix**: Check if peer connection is initialized before adding candidate

## Summary

The WebRTC connection requires THREE steps:
1. ✅ **Offer/Answer Exchange** - WORKING
2. ❌ **ICE Candidate Exchange** - NEEDS VERIFICATION
3. ❌ **Media Flow** - DEPENDS ON ICE

If ICE candidates aren't exchanged, the connection will fail even though offer/answer succeeded.

**Next Step**: Run the test and check the console logs for ICE candidate exchange. If you don't see the logs, the issue is in the ICE candidate flow.
