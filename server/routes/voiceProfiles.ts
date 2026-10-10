import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { VoiceProfileService } from '../services/voiceProfileService';

const router = Router();

router.get('/profiles', requireAuth(), async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId;
    const profiles = await VoiceProfileService.getVoiceProfiles(userId);
    res.json(profiles);
  } catch (error) {
    console.error('Failed to fetch voice profiles:', error);
    return res.status(500).json({ error: 'Failed to fetch voice profiles' });
  }
});

router.get('/stats', requireAuth(), async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId;
    const stats = await VoiceProfileService.getVoiceStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch voice stats:', error);
    return res.status(500).json({ error: 'Failed to fetch voice stats' });
  }
});

router.post('/analyze-profile', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { profileName, voiceType, useCase, targetAudience } = req.body;

    if (!profileName || !voiceType || !useCase || !targetAudience) {
      return res.status(400).json({ error: 'profileName, voiceType, useCase, and targetAudience are required' });
    }

    const result = await VoiceProfileService.analyzeVoiceProfile(userId, profileName, voiceType, useCase, targetAudience);
    res.json(result);
  } catch (error: any) {
    console.error('Analyze profile error:', error);
    res.status(500).json({
      error: 'Failed to analyze voice profile',
      message: error?.message || 'Unknown error',
    });
  }
});

router.post('/generate-profile', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { requirements } = req.body;

    if (!requirements || typeof requirements !== 'object') {
      return res.status(400).json({ error: 'requirements object is required' });
    }

    const result = await VoiceProfileService.generateVoiceProfile(userId, requirements);
    res.json(result);
  } catch (error: any) {
    console.error('Generate profile error:', error);
    res.status(500).json({
      error: 'Failed to generate voice profile',
      message: error?.message || 'Unknown error',
    });
  }
});

router.post('/optimize-profile', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { profileId, useCase, audience } = req.body;

    if (!profileId || !useCase || !audience) {
      return res.status(400).json({ error: 'profileId, useCase, and audience are required' });
    }

    const result = await VoiceProfileService.optimizeVoiceForUseCase(userId, profileId, useCase, audience);
    res.json(result);
  } catch (error: any) {
    console.error('Optimize profile error:', error);
    res.status(500).json({
      error: 'Failed to optimize voice profile',
      message: error?.message || 'Unknown error',
    });
  }
});

router.post('/generate-script', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { scriptType, duration, targetAudience, keyMessages } = req.body;

    if (!scriptType || !duration || !targetAudience || !Array.isArray(keyMessages)) {
      return res.status(400).json({ error: 'scriptType, duration, targetAudience, and keyMessages are required' });
    }

    const result = await VoiceProfileService.generateVoiceScript(userId, scriptType, duration, targetAudience, keyMessages);
    res.json(result);
  } catch (error: any) {
    console.error('Generate script error:', error);
    res.status(500).json({
      error: 'Failed to generate voice script',
      message: error?.message || 'Unknown error',
    });
  }
});

export function registerVoiceProfilesRoutes(app: any) {
  app.use('/api/voice-profiles', router);
}

export default router;
