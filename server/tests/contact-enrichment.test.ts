import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../db';
import { contacts, contactActivities } from '../db/schema';
import { eq } from 'drizzle-orm';

// Mock OpenAI
vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor() {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      companySize: '500+ employees',
                      industry: 'Technology',
                      socialProfiles: {
                        linkedin: 'https://linkedin.com/in/johndoe',
                        twitter: '@johndoe',
                      },
                      insights: 'High-growth tech company, decision maker role',
                    }),
                  },
                },
              ],
            }),
          },
        },
      };
    }
  },
}));

describe('Contact Enrichment API', () => {
  let testUserId: string;
  let testContactId: string;

  beforeEach(async () => {
    // Create test user
    testUserId = 'test-user-' + Date.now();

    // Create test contact
    const [contact] = await db
      .insert(contacts)
      .values({
        userId: testUserId,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        position: 'CEO',
        title: 'CEO',
        status: 'lead',
        leadScore: 50,
        engagementScore: 50,
        createdBy: 'user',
        dataSource: 'manual',
        interestLevel: 'medium',
      })
      .returning();

    testContactId = contact.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(contactActivities).where(eq(contactActivities.contactId, testContactId));
    await db.delete(contacts).where(eq(contacts.id, testContactId));
  });

  describe('POST /api/contacts/:id/enrich', () => {
    it('should enrich contact with AI data', async () => {
      const response = await request(app)
        .post(`/api/contacts/${testContactId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('enriched', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('companySize', '500+ employees');
      expect(response.body.data).toHaveProperty('industry', 'Technology');
    });

    it('should update contact with enrichment data', async () => {
      await request(app)
        .post(`/api/contacts/${testContactId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      // Verify contact was updated
      const [updatedContact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, testContactId));

      expect(updatedContact.lastEnrichment).toBeDefined();
      expect(updatedContact.lastEnrichment.companySize).toBe('500+ employees');
      expect(updatedContact.lastEnrichment.industry).toBe('Technology');
    });

    it('should log enrichment activity', async () => {
      await request(app)
        .post(`/api/contacts/${testContactId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      // Verify activity was logged
      const activities = await db
        .select()
        .from(contactActivities)
        .where(eq(contactActivities.contactId, testContactId));

      expect(activities.length).toBeGreaterThan(0);
      const enrichmentActivity = activities.find((a) => a.activityType === 'enrichment');
      expect(enrichmentActivity).toBeDefined();
      expect(enrichmentActivity.description).toContain('AI enrichment completed');
    });

    it('should return 404 for non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/contacts/${fakeId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Contact not found');
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock AI failure
      const mockOpenAI = vi.mocked(vi.importMock('openai'));
      mockOpenAI.default.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
          },
        },
      }));

      const response = await request(app)
        .post(`/api/contacts/${testContactId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Enrichment failed');
    });

    it('should validate enrichment data format', async () => {
      // Mock invalid AI response
      const mockOpenAI = vi.mocked(vi.importMock('openai'));
      mockOpenAI.default.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Invalid JSON response',
                  },
                },
              ],
            }),
          },
        },
      }));

      const response = await request(app)
        .post(`/api/contacts/${testContactId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to parse enrichment data');
    });
  });

  describe('GET /api/contacts/:id/enrichment-history', () => {
    it('should return enrichment history', async () => {
      // First enrich the contact
      await request(app)
        .post(`/api/contacts/${testContactId}/enrich`)
        .set('Authorization', `Bearer ${testUserId}`)
        .send();

      const response = await request(app)
        .get(`/api/contacts/${testContactId}/enrichment-history`)
        .set('Authorization', `Bearer ${testUserId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('timestamp');
      expect(response.body[0]).toHaveProperty('source', 'OpenAI');
      expect(response.body[0]).toHaveProperty('data');
    });

    it('should return empty array for contact with no enrichment history', async () => {
      const response = await request(app)
        .get(`/api/contacts/${testContactId}/enrichment-history`)
        .set('Authorization', `Bearer ${testUserId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Contact Scoring API', () => {
    describe('POST /api/contacts/:id/score', () => {
      it('should calculate and update AI score', async () => {
        const response = await request(app)
          .post(`/api/contacts/${testContactId}/score`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send({
            factors: ['engagement', 'company_size', 'position'],
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('score');
        expect(response.body).toHaveProperty('rationale');
        expect(typeof response.body.score).toBe('number');
        expect(response.body.score).toBeGreaterThanOrEqual(0);
        expect(response.body.score).toBeLessThanOrEqual(100);
      });

      it('should update contact with new score', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/score`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send();

        const [updatedContact] = await db
          .select()
          .from(contacts)
          .where(eq(contacts.id, testContactId));

        expect(updatedContact.aiScore).toBeDefined();
        expect(updatedContact.aiScoreRationale).toBeDefined();
      });

      it('should log scoring activity', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/score`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send();

        const activities = await db
          .select()
          .from(contactActivities)
          .where(eq(contactActivities.contactId, testContactId));

        const scoringActivity = activities.find((a) => a.activityType === 'scoring');
        expect(scoringActivity).toBeDefined();
        expect(scoringActivity.description).toContain('AI scoring completed');
      });
    });

    describe('GET /api/contacts/scoring-stats', () => {
      it('should return scoring statistics', async () => {
        // Create contacts with different scores
        await db.insert(contacts).values([
          {
            userId: testUserId,
            name: 'High Score Contact',
            firstName: 'High',
            lastName: 'Score',
            email: 'high@example.com',
            company: 'High Corp',
            title: 'CEO',
            aiScore: 90,
            leadScore: 85,
            engagementScore: 80,
            createdBy: 'user',
            dataSource: 'manual',
            interestLevel: 'hot',
          },
          {
            userId: testUserId,
            name: 'Low Score Contact',
            firstName: 'Low',
            lastName: 'Score',
            email: 'low@example.com',
            company: 'Low Corp',
            title: 'Intern',
            aiScore: 30,
            leadScore: 25,
            engagementScore: 20,
            createdBy: 'user',
            dataSource: 'manual',
            interestLevel: 'cold',
          },
        ]);

        const response = await request(app)
          .get('/api/contacts/scoring-stats')
          .set('Authorization', `Bearer ${testUserId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('averageAiScore');
        expect(response.body).toHaveProperty('totalContacts');
        expect(response.body).toHaveProperty('highPriorityCount');
        expect(response.body.totalContacts).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Custom Fields API', () => {
    describe('PUT /api/contacts/:id/custom-fields', () => {
      it('should update custom fields', async () => {
        const customFields = {
          budget: '$500k',
          timeline: '6 months',
          priority: 'high',
        };

        const response = await request(app)
          .put(`/api/contacts/${testContactId}/custom-fields`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send({ customFields });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('updated', true);

        // Verify custom fields were updated
        const [updatedContact] = await db
          .select()
          .from(contacts)
          .where(eq(contacts.id, testContactId));

        expect(updatedContact.customFields).toEqual(customFields);
      });

      it('should validate custom field data', async () => {
        const invalidFields = {
          'invalid-key': 'value',
          'another invalid key': 'value',
        };

        const response = await request(app)
          .put(`/api/contacts/${testContactId}/custom-fields`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send({ customFields: invalidFields });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Invalid custom field keys');
      });

      it('should merge with existing custom fields', async () => {
        // Set initial custom fields
        await db
          .update(contacts)
          .set({ customFields: { initial: 'value' } })
          .where(eq(contacts.id, testContactId));

        const response = await request(app)
          .put(`/api/contacts/${testContactId}/custom-fields`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send({ customFields: { additional: 'field' } });

        expect(response.status).toBe(200);

        const [updatedContact] = await db
          .select()
          .from(contacts)
          .where(eq(contacts.id, testContactId));

        expect(updatedContact.customFields).toEqual({
          initial: 'value',
          additional: 'field',
        });
      });
    });

    describe('DELETE /api/contacts/:id/custom-fields/:key', () => {
      it('should delete specific custom field', async () => {
        // Set up custom fields
        await db
          .update(contacts)
          .set({ customFields: { field1: 'value1', field2: 'value2' } })
          .where(eq(contacts.id, testContactId));

        const response = await request(app)
          .delete(`/api/contacts/${testContactId}/custom-fields/field1`)
          .set('Authorization', `Bearer ${testUserId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('deleted', true);

        const [updatedContact] = await db
          .select()
          .from(contacts)
          .where(eq(contacts.id, testContactId));

        expect(updatedContact.customFields).toEqual({ field2: 'value2' });
      });
    });
  });

  describe('Contact Activities API', () => {
    describe('GET /api/contacts/:id/activities', () => {
      it('should return contact activities', async () => {
        // Create some test activities
        await db.insert(contactActivities).values([
          {
            contactId: testContactId,
            userId: testUserId,
            activityType: 'email',
            description: 'Sent introductory email',
            direction: 'outbound',
          },
          {
            contactId: testContactId,
            userId: testUserId,
            activityType: 'call',
            description: 'Had discovery call',
            direction: 'outbound',
          },
        ]);

        const response = await request(app)
          .get(`/api/contacts/${testContactId}/activities`)
          .set('Authorization', `Bearer ${testUserId}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toHaveProperty('activityType', 'email');
        expect(response.body[1]).toHaveProperty('activityType', 'call');
      });

      it('should filter activities by type', async () => {
        await db.insert(contactActivities).values([
          {
            contactId: testContactId,
            userId: testUserId,
            activityType: 'email',
            description: 'Email 1',
            direction: 'outbound',
          },
          {
            contactId: testContactId,
            userId: testUserId,
            activityType: 'meeting',
            description: 'Meeting 1',
            direction: 'outbound',
          },
        ]);

        const response = await request(app)
          .get(`/api/contacts/${testContactId}/activities?type=email`)
          .set('Authorization', `Bearer ${testUserId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].activityType).toBe('email');
      });

      it('should paginate activities', async () => {
        // Create multiple activities
        const activities = Array.from({ length: 10 }, (_, i) => ({
          contactId: testContactId,
          userId: testUserId,
          activityType: 'email',
          description: `Email ${i + 1}`,
          direction: 'outbound' as const,
        }));

        await db.insert(contactActivities).values(activities);

        const response = await request(app)
          .get(`/api/contacts/${testContactId}/activities?page=1&limit=5`)
          .set('Authorization', `Bearer ${testUserId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(5);
      });
    });

    describe('POST /api/contacts/:id/activities', () => {
      it('should create new activity', async () => {
        const activityData = {
          activityType: 'note',
          description: 'Added important note about the contact',
          direction: 'inbound',
          metadata: { priority: 'high' },
        };

        const response = await request(app)
          .post(`/api/contacts/${testContactId}/activities`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send(activityData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.activityType).toBe('note');
        expect(response.body.description).toBe(activityData.description);
      });

      it('should validate activity data', async () => {
        const invalidActivity = {
          activityType: 'invalid_type',
          description: '',
          direction: 'invalid',
        };

        const response = await request(app)
          .post(`/api/contacts/${testContactId}/activities`)
          .set('Authorization', `Bearer ${testUserId}`)
          .send(invalidActivity);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });
  });
});
