# WebRTC Implementation Guide - 2025 Standards

## Overview
Complete rebuild of WebRTC system using Perfect Negotiation pattern and proper React lifecycle management.

## Files Created

### Backend
- **`backend/src/sockets/index.ts`** - Single unified socket server
  - Middleware authentication
  - Consultation events (join, signal, leave)
  - Chat events (all prefixed with `chat:`)
  - Proper error handling

### Frontend
- **`frontend/src/hooks/useWebRTC.ts`** - Production-grade WebRTC hook
  - Perfect Negotiation pattern
  - React StrictMode compatible
  - Connection state tracking
  - Proper cleanup

## How to Use the Hook

### Basic Usage in a Component

```typescript
import { useWebRTC } from '@/hooks/useWebRTC';

export function ConsultationCallPage() {
  const isDoctor = true; // or false for patient
  const videoRoomId = 'room-123';
  const consultationId = 'consultation-456';

  const {
    localStream,
    remoteStream,
    connectionState,
    isReady,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({
    videoRoomId,
    consultationId,
    isInitiator: isDoctor,
    onRemoteStream: (stream) => {
      console.log('Remote stream received!');
    },
    onConnectionChange: (state) => {
      if (state === 'connected') {
        console.log('Call connected!');
      }
    },
  });

  return (
    <div>
      {/* Local video */}
      {localStream && (
        <video
          autoPlay
          muted
          ref={(el) => {
            if (el) el.srcObject = localStream;
          }}
        />
      )}

      {/* Remote video */}
      {remoteStream && (
        <video
          autoPlay
          ref={(el) => {
            if (el) el.srcObject = remoteStream;
          }}
        />
      )}

      {/* Controls */}
      <button onClick={toggleAudio}>Toggle Audio</button>
      <button onClick={toggleVideo}>Toggle Video</button>
      <button onClick={endCall}>End Call</button>

      {/* Status */}
      <p>Status: {connectionState}</p>
      <p>Ready: {isReady ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Hook API Reference

### Input Props

```typescript
interface UseWebRTCProps {
  videoRoomId: string;           // Unique room identifier
  consultationId: string;        // Consultation ID from database
  isInitiator: boolean;          // true for doctor, false for patient
  onRemoteStream?: (stream: MediaStream) => void;  // Called when remote stream arrives
  onConnectionChange?: (state: RTCPeerConnectionState) => void;  // Called when connection state changes
}
```

### Return Values

```typescript
{
  localStream: MediaStream | null;           // User's own video/audio
  remoteStream: MediaStream | null;          // Other party's video/audio
  connectionState: RTCPeerConnectionState;   // 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'
  isReady: boolean;                          // true when room joined and ready for WebRTC
  toggleAudio: () => boolean;                // Toggle audio, returns new state
  toggleVideo: () => boolean;                // Toggle video, returns new state
  endCall: () => void;                       // End call and cleanup
}
```

## Connection States

```
'new'           → Initial state
'connecting'    → Attempting to connect
'connected'     → Successfully connected (video/audio flowing)
'disconnected'  → Temporarily disconnected
'failed'        → Connection failed
'closed'        → Connection closed
```

## Perfect Negotiation Pattern

The hook implements the Perfect Negotiation pattern, which means:

1. **Initiator (Doctor)**
   - Triggers `onnegotiationneeded` when ready
   - Creates and sends offer
   - Receives answer from patient
   - Connection established

2. **Responder (Patient)**
   - Receives offer from doctor
   - Creates and sends answer
   - Sends ICE candidates
   - Connection established

3. **Collision Handling**
   - If both try to send offers simultaneously
   - Responder ignores the collision
   - Initiator's offer wins
   - No race conditions

## Lifecycle Flow

```
1. Component mounts
   ↓
2. Socket connects with JWT token
   ↓
3. User joins consultation room
   ↓
4. Backend broadcasts peer-joined event
   ↓
5. Hook sets isReady = true
   ↓
6. Request getUserMedia (local camera/mic)
   ↓
7. Create RTCPeerConnection
   ↓
8. Add local tracks to peer connection
   ↓
9. Perfect Negotiation starts
   ↓
10. Offer/Answer exchange via Socket.IO
    ↓
11. ICE candidates exchanged
    ↓
12. Remote tracks received
    ↓
13. connectionState = 'connected'
    ↓
14. Video/audio flowing
```

## Error Handling

The hook handles errors gracefully:

```typescript
// Media errors
- No camera/mic permission → Error logged, no crash
- Device not available → Error logged, graceful degradation

// Network errors
- Socket disconnect → isReady = false, can reconnect
- Connection failed → connectionState = 'failed'
- Invalid room → Error emitted, socket.emit('consultation:error')

// WebRTC errors
- ICE candidate errors → Logged but non-fatal
- Negotiation errors → Logged, can retry
```

## Important Notes

### React StrictMode
- Hook is fully compatible with React StrictMode
- Uses `initialized.useRef` to prevent double initialization
- Safe to use in development with StrictMode enabled

### Memory Management
- All event listeners properly cleaned up on unmount
- Media streams stopped on unmount
- Peer connection closed on unmount
- No memory leaks

### Browser Compatibility
- Requires WebRTC support (modern browsers)
- Tested on Chrome, Firefox, Safari, Edge
- Requires HTTPS in production (WebRTC requirement)

## Debugging

Enable detailed logging:

```typescript
// In browser console
localStorage.setItem('debug', '*');

// Look for these log patterns:
// [WebRTC] - Main hook logs
// [Socket] - Socket connection logs
// [Consultation] - Consultation room logs
```

## Common Issues & Solutions

### "No auth token"
- Ensure user is logged in
- Check localStorage for 'auth_token'
- Verify token is valid

### "Unauthorized"
- Check consultation authorization
- Verify user is doctor or patient in consultation
- Check database for correct user IDs

### "Invalid room"
- Verify videoRoomId matches database
- Check consultation.videoRoomId
- Ensure room was created properly

### No video/audio
- Check browser permissions
- Verify camera/mic is not in use elsewhere
- Check browser console for getUserMedia errors
- Try different browser

### Connection fails
- Check network connectivity
- Verify backend is running
- Check Socket.IO connection
- Look for CORS errors

## Next Steps

1. **Update Consultation Call Pages**
   - Replace old `useConsultationWebRTC` with `useWebRTC`
   - Update component to use new hook API

2. **Test Scenarios**
   - Doctor initiates call
   - Patient joins call
   - Both see video/audio
   - Disconnect and reconnect
   - Multiple calls in sequence

3. **Production Deployment**
   - Ensure HTTPS enabled
   - Configure CORS properly
   - Set up monitoring/logging
   - Test on real devices

## References

- [WebRTC Perfect Negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [Socket.IO Documentation](https://socket.io/docs/)
- [React Hooks Best Practices](https://react.dev/reference/react/useEffect)
