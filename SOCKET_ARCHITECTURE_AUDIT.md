# Socket Architecture Audit - Complete Analysis

## Current Architecture (BROKEN)

### Backend Socket Setup
```
server.ts (line 40-65):
├── Root namespace "/" (line 47-59)
│   ├── identify_as_doctor event
│   └── disconnect event
├── Chat handlers (line 62) → setupChatSocket(io)
│   └── Listens on root "/" namespace
└── WebRTC handlers (line 65) → setupWebRTCConsultationSocket(io)
    └── Creates /consultation namespace (line 15)
```

### Frontend Socket Connections

#### 1. Chat (ChatPage.tsx, line 42)
```typescript
const newSocket = io(socketUrl);  // Connects to root "/"
```

#### 2. WebRTC (useConsultationWebRTC.ts, line 73)
```typescript
socketRef.current = io(backendUrl);  // Connects to root "/"
// BUT backend expects /consultation namespace!
```

## THE BUG

**Doctor and Patient connect to DIFFERENT namespaces:**

```
Doctor:
  Frontend: io(http://localhost:4000) → root "/"
  Backend: Listening on /consultation namespace
  Result: ❌ Doctor connects to root, WebRTC handlers not triggered

Patient:
  Frontend: io(http://localhost:4000) → root "/"
  Backend: Listening on /consultation namespace
  Result: ❌ Patient connects to root, WebRTC handlers not triggered

Chat:
  Frontend: io(http://localhost:4000) → root "/"
  Backend: Listening on root "/"
  Result: ✅ Chat works (both on root)
```

## Root Cause

**webrtc.consultation.ts creates a namespace but frontend doesn't connect to it:**

```typescript
// Backend (webrtc.consultation.ts, line 15)
const consultationNamespace = io.of("/consultation");
consultationNamespace.on("connection", ...);

// Frontend (useConsultationWebRTC.ts, line 73)
socketRef.current = io(backendUrl);  // Missing /consultation!
// Should be: io(`${backendUrl}/consultation`, ...)
```

## Solution: Single Socket Connection with Event Prefixes

**RECOMMENDATION: Use single socket connection for ALL events**

Instead of multiple namespaces, use ONE socket with event prefixes:

```
Root namespace "/" handles:
- chat:send_message
- chat:join_room
- webrtc:offer
- webrtc:answer
- webrtc:ice_candidate
- webrtc:join_room
```

### Benefits
1. ✅ Single socket connection per user
2. ✅ No namespace confusion
3. ✅ Easier to manage
4. ✅ Better for mobile (fewer connections)
5. ✅ Simpler debugging

### Implementation Plan

1. **Backend Changes**
   - Remove `/consultation` namespace from webrtc.consultation.ts
   - Move WebRTC handlers to root namespace
   - Prefix events with `webrtc:` instead of bare names
   - Keep chat handlers on root namespace with `chat:` prefix

2. **Frontend Changes**
   - useConsultationWebRTC.ts: Connect to root namespace (no change needed)
   - ChatPage.tsx: Already connects to root (no change needed)
   - Update event names to use prefixes

3. **Event Mapping**
   ```
   WebRTC Events:
   - webrtc:join_room (was: join_consultation_room)
   - webrtc:offer (was: webrtc_offer)
   - webrtc:answer (was: webrtc_answer)
   - webrtc:ice_candidate (was: webrtc_ice_candidate)
   
   Chat Events:
   - chat:join_room (was: join_room)
   - chat:send_message (was: send_message)
   - chat:typing (was: typing)
   - chat:stop_typing (was: stop_typing)
   - chat:mark_seen (was: mark_seen)
   - chat:leave_room (was: leave_room)
   ```

## Files to Modify

1. **backend/src/sockets/webrtc.consultation.ts**
   - Remove namespace creation
   - Change to root namespace handlers
   - Prefix all events with `webrtc:`

2. **backend/src/sockets/chat.socket.ts**
   - Prefix all events with `chat:`

3. **frontend/src/hooks/useConsultationWebRTC.ts**
   - Update event names to use `webrtc:` prefix
   - No URL change needed (already root)

4. **frontend/src/pages/chat/ChatPage.tsx**
   - Update event names to use `chat:` prefix

## Verification Checklist

- [ ] Backend: WebRTC handlers on root namespace
- [ ] Backend: All WebRTC events prefixed with `webrtc:`
- [ ] Backend: All chat events prefixed with `chat:`
- [ ] Frontend: useConsultationWebRTC connects to root (no change)
- [ ] Frontend: All WebRTC events use `webrtc:` prefix
- [ ] Frontend: All chat events use `chat:` prefix
- [ ] Doctor and patient connect to SAME namespace
- [ ] Doctor's offer reaches patient
- [ ] Patient's answer reaches doctor
- [ ] ICE candidates exchanged
- [ ] Chat still works
- [ ] No multiple socket instances

## Expected Result

Single socket connection per user handling all real-time events with clear event prefixes.
