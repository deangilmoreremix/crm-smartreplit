/**
 * User API Keys Routes
 * CRUD operations for user-provided OpenAI and OpenClaw API keys
 */

import type { Express, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { userApiKeys } from '../../shared/schema';
import { requireAuth } from './auth';
import { DEFAULT_MODEL } from '../services/openaiModels';
import { isSafeExternalUrl } from '../services/safeUrl';

// openai: the user's own key for all AI features; openclaw: key + optional base URL (metadata.base_url)
const SUPPORTED_PROVIDERS = ['openai', 'openclaw'];

// Google AI interface for testing
interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export function registerApiKeyRoutes(app: Express) {
  const requireApiKeyAuth = requireAuth();

  // Get all API keys for the authenticated user (masked)
  app.get('/api/user/api-keys', requireApiKeyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const keys = await db.query.userApiKeys.findMany({
        where: eq(userApiKeys.userId, userId),
        orderBy: (userApiKeys, { desc }) => [desc(userApiKeys.createdAt)],
      });

      // Mask the API keys for security - only show first 4 and last 4 chars
      const maskedKeys = keys.map((key) => ({
        ...key,
        apiKey: maskApiKey(key.apiKey),
      }));

      res.json({ success: true, keys: maskedKeys });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });

  // Add a new API key
  app.post('/api/user/api-keys', requireApiKeyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { provider, apiKey, apiKeyName, model, isDefault, baseUrl } = req.body;

      // Validate provider
      if (!SUPPORTED_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: 'Provider must be "openai" or "openclaw"' });
      }

      // OpenClaw may point at a self-hosted instance; the URL must be safe for the server to call
      let metadata: Record<string, any> | undefined;
      if (provider === 'openclaw' && baseUrl !== undefined) {
        if (baseUrl && !(await isSafeExternalUrl(String(baseUrl)))) {
          return res.status(400).json({
            error: 'OpenClaw base URL must be a public https URL',
          });
        }
        metadata = baseUrl ? { base_url: String(baseUrl).trim() } : {};
      }

      // Validate API key format
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return res.status(400).json({ error: 'API key must be at least 10 characters' });
      }

      // Provider-specific format validation
      if (provider === 'openai' && !apiKey.startsWith('sk-')) {
        return res.status(400).json({
          error: 'Invalid OpenAI API key format. Key must start with "sk-"',
        });
      }

      // Check if user already has a key for this provider
      const existingKeys = await db.query.userApiKeys.findMany({
        where: and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)),
      });

      // One key per provider per user (UNIQUE (user_id, provider)): saving again replaces the key
      if (existingKeys.length > 0) {
        const [updatedKey] = await db
          .update(userApiKeys)
          .set({
            apiKey: apiKey.trim(),
            ...(model !== undefined && { model: model || null }),
            ...(metadata !== undefined && { metadata }),
            isActive: true,
            isDefault: true,
            updatedAt: new Date(),
          })
          .where(eq(userApiKeys.id, existingKeys[0].id))
          .returning();
        return res.json({ success: true, key: { ...updatedKey, apiKey: maskApiKey(updatedKey.apiKey) } });
      }

      // If setting as default, unset any existing default for this provider
      if (isDefault && existingKeys.length > 0) {
        await db
          .update(userApiKeys)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)));
      }

      // If this is the first key for this provider, make it default
      const shouldBeDefault = isDefault || existingKeys.length === 0;

      const [newKey] = await db
        .insert(userApiKeys)
        .values({
          userId,
          provider,
          apiKey: apiKey.trim(),
          apiKeyName: apiKeyName || null,
          model: model || null,
          ...(metadata !== undefined && { metadata }),
          isDefault: shouldBeDefault,
          isActive: true,
          testStatus: 'pending',
        })
        .returning();

      res.status(201).json({
        success: true,
        key: {
          ...newKey,
          apiKey: maskApiKey(newKey.apiKey),
        },
      });
    } catch (error) {
      console.error('Error adding API key:', error);
      res.status(500).json({ error: 'Failed to add API key' });
    }
  });

  // Test an API key
  app.post('/api/user/api-keys/:id/test', requireApiKeyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const keyId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      // Get the key
      const apiKeyRecord = await db.query.userApiKeys.findFirst({
        where: and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId)),
      });

      if (!apiKeyRecord) {
        return res.status(404).json({ error: 'API key not found' });
      }

      let testResult: { success: boolean; error?: string };

      if (apiKeyRecord.provider === 'openai') {
        testResult = await testOpenAIKey(apiKeyRecord.apiKey);
      } else if (apiKeyRecord.provider === 'openclaw') {
        testResult = await testOpenClawKey(
          apiKeyRecord.apiKey,
          (apiKeyRecord.metadata as any)?.base_url
        );
      } else {
        return res.status(400).json({ error: 'Unknown provider' });
      }

      // Update the key with test results
      await db
        .update(userApiKeys)
        .set({
          lastTestedAt: new Date(),
          testStatus: testResult.success ? 'success' : 'failed',
          testError: testResult.error || null,
          updatedAt: new Date(),
        })
        .where(eq(userApiKeys.id, keyId));

      res.json({
        success: testResult.success,
        provider: apiKeyRecord.provider,
        error: testResult.error || null,
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      res.status(500).json({ error: 'Failed to test API key' });
    }
  });

  // Update an API key
  app.put('/api/user/api-keys/:id', requireApiKeyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const keyId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const { apiKeyName, model, isDefault, isActive } = req.body;

      // Verify the key belongs to the user
      const existingKey = await db.query.userApiKeys.findFirst({
        where: and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId)),
      });

      if (!existingKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      // If setting as default, unset any existing default for this provider
      if (isDefault) {
        await db
          .update(userApiKeys)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(userApiKeys.userId, userId),
              eq(userApiKeys.provider, existingKey.provider),
              eq(userApiKeys.isDefault, true)
            )
          );
      }

      const [updatedKey] = await db
        .update(userApiKeys)
        .set({
          ...(apiKeyName !== undefined && { apiKeyName }),
          ...(model !== undefined && { model }),
          ...(isDefault !== undefined && { isDefault }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(userApiKeys.id, keyId))
        .returning();

      res.json({
        success: true,
        key: {
          ...updatedKey,
          apiKey: maskApiKey(updatedKey.apiKey),
        },
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Failed to update API key' });
    }
  });

  // Delete an API key
  app.delete('/api/user/api-keys/:id', requireApiKeyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const keyId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      // Verify the key belongs to the user
      const existingKey = await db.query.userApiKeys.findFirst({
        where: and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId)),
      });

      if (!existingKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      await db.delete(userApiKeys).where(eq(userApiKeys.id, keyId));

      // If the deleted key was default, set another key of the same provider as default
      if (existingKey.isDefault) {
        const nextKey = await db.query.userApiKeys.findFirst({
          where: and(
            eq(userApiKeys.userId, userId),
            eq(userApiKeys.provider, existingKey.provider),
            eq(userApiKeys.isActive, true)
          ),
        });

        if (nextKey) {
          await db
            .update(userApiKeys)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(userApiKeys.id, nextKey.id));
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  });

  // Get the active API key for a specific provider (for internal use by AI routes)
  app.get('/api/user/api-keys/active/:provider', requireApiKeyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const provider = req.params.provider;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Database not available' });
      }

      if (!SUPPORTED_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: 'Provider must be "openai" or "openclaw"' });
      }

      // Get the default active key for this provider
      const activeKey = await db.query.userApiKeys.findFirst({
        where: and(
          eq(userApiKeys.userId, userId),
          eq(userApiKeys.provider, provider),
          eq(userApiKeys.isActive, true),
          eq(userApiKeys.isDefault, true)
        ),
      });

      if (!activeKey) {
        // Fallback to any active key
        const anyKey = await db.query.userApiKeys.findFirst({
          where: and(
            eq(userApiKeys.userId, userId),
            eq(userApiKeys.provider, provider),
            eq(userApiKeys.isActive, true)
          ),
        });

        if (!anyKey) {
          return res.status(404).json({ error: `No active ${provider} API key found` });
        }

        return res.json({
          success: true,
          key: {
            id: anyKey.id,
            provider: anyKey.provider,
            apiKey: anyKey.apiKey,
            model: anyKey.model,
          },
        });
      }

      res.json({
        success: true,
        key: {
          id: activeKey.id,
          provider: activeKey.provider,
          apiKey: activeKey.apiKey,
          model: activeKey.model,
        },
      });
    } catch (error) {
      console.error('Error fetching active API key:', error);
      res.status(500).json({ error: 'Failed to fetch active API key' });
    }
  });

  console.log('✅ API key routes registered');
}

// Helper: Mask API key for display
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

// Helper: Test OpenAI API key
async function testOpenAIKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });
    // Validates the key and access to the app's default model without spending tokens
    await client.models.retrieve(DEFAULT_MODEL);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'OpenAI API key validation failed',
    };
  }
}

// Helper: Test an OpenClaw key against its health endpoint (per-user base URL or OPENCLAW_API_URL)
async function testOpenClawKey(
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const url = (baseUrl || process.env.OPENCLAW_API_URL || '').replace(/\/+$/, '');
  if (!url) return { success: false, error: 'No OpenClaw URL configured' };
  if (baseUrl && !(await isSafeExternalUrl(baseUrl))) {
    return { success: false, error: 'OpenClaw base URL must be a public https URL' };
  }
  try {
    const response = await fetch(`${url}/api/v1/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    return response.ok
      ? { success: true }
      : { success: false, error: `OpenClaw health check failed (${response.status})` };
  } catch (error: any) {
    return { success: false, error: error?.message || 'OpenClaw health check failed' };
  }
}
