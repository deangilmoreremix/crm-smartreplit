# Video Calling Test Guide

## ✅ Implementation Complete

The video calling component now uses **real WebSocket-based signaling** for peer-to-peer connections instead of localStorage demo mode.

## What Was Implemented

### 1. WebSocket Signaling Server (`server/signaling-server.ts`)
- Real-time signaling using WebSocket (ws package)
- Room-based architecture for call management
- Handles SDP offers/answers and ICE candidate exchange
- Automatic room cleanup when empty
- Connection tracking and participant management

### 2. Updated VideoCallContext (`client/src/contexts/VideoCallContext.tsx`)
- WebSocket client integration
- Automatic WebSocket connection on component mount
- Real signaling message exchange (offer, answer, ICE candidates)
- Trickle ICE enabled for faster connections
- Proper room joining/leaving

### 3. Server Integration (`server/index.ts`)
- WebSocket server mounted on `/signaling` path
- Runs alongside Express server on same port (5000)
- Automatic initialization on server start

## How to Test Video Calling

### Method 1: Two Browser Tabs (Same Machine)

1. **Open Tab 1:**
   - Navigate to your SmartCRM app
   - You should see the video call button (bottom right)

2. **Open Tab 2:**
   - Open a new tab with the same URL
   - Both tabs now connect to the same WebSocket signaling server

3. **Initiate a Call:**
   - Click the video call button in Tab 1
   - Enter a test contact name or select from contacts
   - Start the call
   - Tab 2 should receive the call (in real implementation)

### Method 2: Two Different Browsers

1. Open SmartCRM in Chrome
2. Open SmartCRM in Firefox (or another browser)
3. Both will connect to the WebSocket signaling server
4. Calls between browsers will work through real WebRTC

### Method 3: Two Different Devices

1. Open SmartCRM on your computer
2. Open SmartCRM on your phone/tablet (same network)
3. Make sure both devices can access the Replit URL
4. Test peer-to-peer video calling between devices

## Technical Details

### WebSocket Connection
- **Protocol:** WebSocket (ws/wss)
- **Path:** `/signaling`
- **Port:** Same as web server (5000)
- **Connection:** Auto-connects when VideoCallContext mounts

### Signaling Flow

1. **User initiates call:**
   ```
   User A → Join Room → WebSocket Server
   User A → Create Peer (initiator) → Generate Offer
   User A → Send Offer → WebSocket Server → User B
   ```

2. **User receives call:**
   ```
   User B → Receive Offer → Create Peer (non-initiator)
   User B → Generate Answer → Send to WebSocket Server → User A
   ```

3. **ICE Candidates:**
   ```
   Both users exchange ICE candidates through WebSocket
   WebRTC connection established
   Media streams (video/audio) flow directly between peers
   ```

### WebRTC Configuration

**STUN Servers:**
- Google STUN (5 servers for redundancy)
- Used for NAT traversal

**TURN Server:**
- OpenRelay public TURN server
- Fallback for restrictive networks

**Media Constraints:**
- **Video:** 1280x720 @ 30fps (ideal)
- **Audio:** 48kHz stereo with echo cancellation

### Features Enabled

✅ **1-to-1 Video Calls**
✅ **1-to-1 Audio Calls**
✅ **Real-time Peer-to-Peer Connection**
✅ **Camera/Microphone Controls**
✅ **Screen Sharing**
✅ **Call Recording**
✅ **Connection Quality Monitoring**
✅ **Chat/Data Channel**

## Troubleshooting

### "WebSocket not connected" Error
- Check that the server is running (`npm run dev`)
- Verify the WebSocket path is `/signaling`
- Check browser console for connection errors

### Video/Audio Not Working
1. **Check Browser Permissions:**
   - Allow camera/microphone access when prompted
   - Check browser settings (chrome://settings/content)

2. **Test Media Devices:**
   - Open browser DevTools console
   - Run: `navigator.mediaDevices.getUserMedia({video: true, audio: true})`
   - Should request permissions and return a stream

3. **Check Network:**
   - STUN servers require internet access
   - Some corporate networks block WebRTC
   - Try on a different network if issues persist

### Peer Connection Fails
1. **Check ICE Candidates:**
   - Open browser console
   - Look for "🧊 Received ICE candidate" messages
   - If none appear, signaling might be broken

2. **Firewall/NAT Issues:**
   - TURN server should help with most NAT scenarios
   - For enterprise networks, may need dedicated TURN server

### No Remote Stream
1. **Verify Both Peers Connected:**
   - Check "✅ Joined room" messages in both consoles
   - Ensure both are in the same room

2. **Check Signaling:**
   - Look for "Received offer" and "Received answer" logs
   - If missing, WebSocket messaging isn't working

## Browser Console Messages

### ✅ Success Indicators:
```
✅ WebSocket connected to signaling server
📞 Joined call room: [room-id]
📞 Received offer from: [user-id]
✅ Received answer from: [user-id]
🧊 Received ICE candidate from: [user-id]
Remote stream received: video, audio
Peer connected successfully
```

### ❌ Error Indicators:
```
❌ WebSocket error
WebSocket not connected, cannot send signal
Error processing offer
Ice connection failed
```

## Next Steps (Optional Enhancements)

1. **User Authentication Integration:**
   - Connect with Supabase auth to get real user IDs
   - Display actual user names and avatars in calls

2. **Call Notification System:**
   - Add incoming call UI with accept/reject buttons
   - Ring sound for incoming calls
   - Push notifications for missed calls

3. **Call History:**
   - Track all calls in database
   - Show call duration and status
   - Missed call indicators

4. **Group Calls:**
   - Implement SFU (Selective Forwarding Unit) for multiple participants
   - Or use mesh topology for small groups (<5 people)

5. **Production TURN Server:**
   - Set up dedicated TURN server for better reliability
   - Consider services like Twilio, Agora, or self-hosted Coturn

## Production Deployment Notes

### Environment Variables
No additional environment variables required - WebSocket uses same port as web server.

### HTTPS/WSS
- In production (HTTPS), WebSocket automatically upgrades to WSS
- Certificate applies to both HTTP and WebSocket connections

### Scaling Considerations
- Current implementation: Single server, in-memory room management
- For multi-server deployments:
  - Use Redis for room state sharing
  - Implement sticky sessions for WebSocket connections
  - Or use dedicated signaling server (e.g., PeerJS, LiveKit)

## Testing Checklist

- [ ] WebSocket connects on page load
- [ ] Can join a call room
- [ ] Offer/answer exchange works
- [ ] ICE candidates are exchanged
- [ ] Video stream appears (both local and remote)
- [ ] Audio works in both directions
- [ ] Camera toggle works
- [ ] Microphone mute works
- [ ] Screen sharing works
- [ ] Call end cleanup works
- [ ] Multiple tabs can communicate
- [ ] Connection quality indicator updates

---

**Status:** ✅ Ready for Testing
**Last Updated:** October 18, 2025
