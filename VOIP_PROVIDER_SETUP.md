# VoIP Provider Setup Guide

## Overview

Your SmartCRM now supports pluggable VoIP providers, allowing users to configure their preferred video calling service instead of being locked into a single provider.

## Supported Providers

### 1. Twilio Video
- **Website**: https://twilio.com
- **Cost**: $0.008/minute + infrastructure fees
- **Features**: Enterprise-grade, global infrastructure, recording, screen sharing

### 2. Daily.co
- **Website**: https://daily.co
- **Cost**: $0.004/minute
- **Features**: Developer-friendly, real-time APIs, HIPAA compliant

## Setup Instructions

### Step 1: Choose Your Provider

1. **Twilio Setup**:
   - Sign up at https://twilio.com
   - Get your Account SID and Auth Token
   - Create an API Key and Secret for Video
   - Note your credentials

2. **Daily.co Setup**:
   - Sign up at https://daily.co
   - Get your API Key from the dashboard
   - Optionally configure a custom domain

### Step 2: Configure in SmartCRM

1. **Access VoIP Settings**:
   - Go to Admin Panel → VoIP Configuration
   - Or navigate to `/admin/voip-config`

2. **Select Provider**:
   - Choose your preferred provider (Twilio or Daily.co)
   - Enter the required credentials
   - Test the configuration

3. **Enable VoIP**:
   - Toggle "Enable VoIP Calling" to ON
   - Save configuration

### Step 3: Test the Integration

1. **Test Configuration**:
   - Use the "Test Configuration" button
   - Verify credentials are valid

2. **Make a Test Call**:
   - Go to any contact in your CRM
   - Click the video call button
   - Verify the call uses your configured provider

## Provider-Specific Configuration

### Twilio Configuration

```json
{
  "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "authToken": "your_auth_token_here",
  "apiKeySid": "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "apiKeySecret": "your_api_key_secret_here"
}
```

### Daily.co Configuration

```json
{
  "apiKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "domain": "your-domain.daily.co" // optional
}
```

## Features by Provider

| Feature | Twilio | Daily.co | Custom WebRTC |
|---------|--------|----------|----------------|
| Video Calling | ✅ | ✅ | ✅ |
| Audio Calling | ✅ | ✅ | ✅ |
| Screen Sharing | ✅ | ✅ | ✅ |
| Recording | ✅ | ✅ | ✅ |
| Group Calls | ✅ | ✅ | ❌ |
| HIPAA Compliant | ❌ | ✅ | ❌ |
| Cost/Minute | $0.008 | $0.004 | $0 |
| Setup Complexity | Medium | Easy | High |

## Troubleshooting

### Common Issues

1. **"Provider not configured" error**:
   - Check that VoIP is enabled in settings
   - Verify credentials are correct
   - Test configuration before saving

2. **Calls not connecting**:
   - Check network connectivity
   - Verify camera/microphone permissions
   - Check provider service status

3. **Recording not working**:
   - Verify recording permissions in provider dashboard
   - Check storage quotas
   - Confirm recording is enabled in call options

### Provider-Specific Issues

#### Twilio Issues
- **403 Forbidden**: Check API Key permissions
- **Room creation failed**: Verify Account SID and Auth Token
- **Recording failed**: Check recording permissions

#### Daily.co Issues
- **401 Unauthorized**: Verify API Key
- **Room not found**: Check domain configuration
- **Recording failed**: Verify recording is enabled in room properties

## API Reference

### VoIP Service Methods

```typescript
import { voipService } from './services/voip/VoIPService';

// Check if VoIP is enabled
const isEnabled = voipService.isEnabled();

// Get current provider info
const provider = voipService.getCurrentProvider();

// Start a call
const call = await voipService.startCall(participants, options);

// End a call
await voipService.endCall(callId);

// Start recording
const recording = await voipService.startRecording(callId);

// Stop recording
const result = await voipService.stopRecording(recordingId);
```

### Provider Interface

```typescript
interface VoIPProvider {
  name: string;
  displayName: string;
  description: string;
  website: string;

  getConfigSchema(): ProviderConfig[];
  initialize(config: Record<string, any>): Promise<void>;
  createRoom(participants: string[], options?: RoomOptions): Promise<Room>;
  joinRoom(roomId: string, participantId: string): Promise<RoomConnection>;
  leaveRoom(roomId: string, participantId: string): Promise<void>;
  startCall(participants: CallParticipant[], options?: CallOptions): Promise<Call>;
  endCall(callId: string): Promise<void>;
  muteParticipant(callId: string, participantId: string, muted: boolean): Promise<void>;
  startRecording(callId: string): Promise<Recording>;
  stopRecording(recordingId: string): Promise<RecordingResult>;
}
```

## Security Considerations

- **Credential Storage**: Credentials are stored securely in browser localStorage
- **Transport Security**: All provider APIs use HTTPS
- **Access Control**: Calls require authentication
- **Data Privacy**: No call data is stored without user consent

## Cost Optimization

### Twilio Cost Optimization
- Use the smallest room size needed
- Disable recording when not required
- Monitor usage in Twilio Console
- Consider reserved instances for high usage

### Daily.co Cost Optimization
- Use room properties to limit features when not needed
- Implement call time limits
- Monitor usage in Daily.co dashboard
- Use webhooks for automated billing

## Migration Guide

### From Custom WebRTC to Provider

1. **Backup current settings**
2. **Choose and configure provider**
3. **Test thoroughly in staging**
4. **Gradual rollout to users**
5. **Monitor for issues**

### Switching Between Providers

1. **Export call history if needed**
2. **Configure new provider**
3. **Test new provider**
4. **Update settings**
5. **Notify users of change**

## Support

For issues with:
- **Twilio**: Check https://status.twilio.com and https://support.twilio.com
- **Daily.co**: Check https://status.daily.co and their documentation
- **SmartCRM VoIP**: Check application logs and contact support

## Future Enhancements

- Additional provider support (Agora, Vonage, etc.)
- Advanced call routing
- Call analytics and reporting
- Integration with CRM workflows
- Mobile app support