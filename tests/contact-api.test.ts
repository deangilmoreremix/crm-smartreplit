import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { db } from '../server/db';
import { contacts, contactActivities } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

vi.mock('../server/services/ai-service', () => ({
  aiService: {
    enrichContact: vi.fn().mockResolvedValue({
      companySize: '500+ employees',
      industry: 'Technology',
      socialProfiles: { linkedin: 'https://linkedin.com/in/example', twitter: '@example' },
      insights: 'Tech decision maker',
    }),
    scoreContact: vi.fn().mockResolvedValue({
      score: 85,
      rationale: 'Strong engagement signals, tech decision maker role',
    }),
  },
}));

describe('Contact API', () => {
  let testUserId: string;
  let testContactId: number;
  const authToken = 'dev-bypass-token-test-user';

  beforeEach(async () => {
    testUserId = 'test-user-' + Date.now();

    const [contact] = await db
      .insert(contacts)
      .values({
        profileId: testUserId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        company: 'Tech Corp',
        position: 'VP Engineering',
        title: 'VP Engineering',
        status: 'lead',
        leadScore: 60,
        engagementScore: 55,
        createdBy: 'user',
        dataSource: 'manual',
        interestLevel: 'medium',
      })
      .returning();

    testContactId = contact.id;
  });

  afterEach(async () => {
    await db.delete(contactActivities).where(eq(contactActivities.contactId, testContactId));
    await db.delete(contacts).where(eq(contacts.id, testContactId));
  });

  describe('CRUD Operations', () => {
    describe('POST /api/contacts', () => {
      it('should create a new contact', async () => {
        const newContact = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1122334455',
          company: 'Acme Inc',
          position: 'CEO',
          title: 'Chief Executive Officer',
          status: 'prospect',
          leadScore: 75,
          engagementScore: 70,
        };

        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(newContact);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.firstName).toBe('John');
        expect(response.body.lastName).toBe('Doe');
        expect(response.body.email).toBe('john.doe@example.com');
        expect(response.body.profileId).toBe('dev-user-12345');

        await db.delete(contacts).where(eq(contacts.id, response.body.id));
      });

      it('should reject invalid contact data', async () => {
        const invalidContact = {
          email: 'not-an-email',
          firstName: '',
        };

        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidContact);

        expect(response.status).toBe(400);
      });

      it('should require authentication', async () => {
        const response = await request(app).post('/api/contacts').send({ firstName: 'Test' });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/contacts', () => {
      it('should return paginated contacts', async () => {
        const response = await request(app)
          .get('/api/contacts')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
      });

      it('should support search query', async () => {
        const response = await request(app)
          .get('/api/contacts?search=Tech')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/contacts?status=lead')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/contacts/:id', () => {
      it('should return a specific contact', async () => {
        const response = await request(app)
          .get(`/api/contacts/${testContactId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', testContactId);
        expect(response.body.firstName).toBe('Jane');
        expect(response.body.email).toBe('jane@example.com');
      });

      it('should return 404 for non-existent contact', async () => {
        const response = await request(app)
          .get('/api/contacts/999999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Contact not found');
      });
    });

    describe('PUT /api/contacts/:id', () => {
      it('should update an existing contact', async () => {
        const updates = {
          firstName: 'Jane Updated',
          leadScore: 80,
        };

        const response = await request(app)
          .put(`/api/contacts/${testContactId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body.firstName).toBe('Jane Updated');
        expect(response.body.leadScore).toBe(80);
        expect(response.body.updatedAt).toBeDefined();
      });

      it('should return 404 for non-existent contact', async () => {
        const response = await request(app)
          .put('/api/contacts/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ firstName: 'Test' });

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/contacts/:id', () => {
      it('should delete an existing contact', async () => {
        const response = await request(app)
          .delete(`/api/contacts/${testContactId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Contact deleted successfully');
      });

      it('should return 404 for non-existent contact', async () => {
        const response = await request(app)
          .delete('/api/contacts/999999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Enrichment Endpoint', () => {
    describe('POST /api/contacts/:id/enrich', () => {
      it('should enrich contact with AI data', async () => {
        const response = await request(app)
          .post(`/api/contacts/${testContactId}/enrich`)
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('enriched');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('companySize');
        expect(response.body.data).toHaveProperty('industry');
      });

      it('should update lastEnrichedAt timestamp', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/enrich`)
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        const [contact] = await db.select().from(contacts).where(eq(contacts.id, testContactId));

        expect(contact.lastEnrichedAt).toBeDefined();
      });

      it('should return 404 for non-existent contact', async () => {
        const response = await request(app)
          .post('/api/contacts/999999/enrich')
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Contact not found');
      });

      it('should log enrichment activity', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/enrich`)
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        const activities = await db
          .select()
          .from(contactActivities)
          .where(eq(contactActivities.contactId, testContactId));

        const enrichmentActivity = activities.find((a) => a.activityType === 'enrichment');
        expect(enrichmentActivity).toBeDefined();
        expect(enrichmentActivity.description).toContain('AI enrichment completed');
      });
    });

    describe('GET /api/contacts/:id/enrichment-history', () => {
      it('should return enrichment history', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/enrich`)
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        const response = await request(app)
          .get(`/api/contacts/${testContactId}/enrichment-history`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('source', 'OpenAI');
        expect(response.body[0]).toHaveProperty('data');
      });

      it('should return empty array for contacts with no enrichment', async () => {
        const response = await request(app)
          .get(`/api/contacts/${testContactId}/enrichment-history`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });
  });

  describe('Scoring Endpoint', () => {
    describe('POST /api/contacts/:id/score', () => {
      it('should calculate AI score for contact', async () => {
        const response = await request(app)
          .post(`/api/contacts/${testContactId}/score`)
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('score');
        expect(response.body).toHaveProperty('rationale');
        expect(typeof response.body.score).toBe('number');
        expect(response.body.score).toBeGreaterThanOrEqual(0);
        expect(response.body.score).toBeLessThanOrEqual(100);
      });

      it('should update contact with AI score', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/score`)
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        const [contact] = await db.select().from(contacts).where(eq(contacts.id, testContactId));

        expect(contact.aiScore).toBeDefined();
        expect(contact.aiScoreRationale).toBeDefined();
      });

      it('should return 404 for non-existent contact', async () => {
        const response = await request(app)
          .post('/api/contacts/999999/score')
          .set('Authorization', `Bearer ${authToken}`)
          .send();

        expect(response.status).toBe(404);
      });

      it('should log scoring activity', async () => {
        await request(app)
          .post(`/api/contacts/${testContactId}/score`)
          .set('Authorization', `Bearer ${authToken}`)
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
        const response = await request(app)
          .get('/api/contacts/scoring-stats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('averageAiScore');
        expect(response.body).toHaveProperty('totalContacts');
        expect(response.body).toHaveProperty('highPriorityCount');
      });
    });
  });

  describe('Custom Fields', () => {
    describe('PUT /api/contacts/:id/custom-fields', () => {
      it('should update custom fields', async () => {
        const customFields = {
          budget: '$250k',
          decisionMaker: 'yes',
          purchaseTimeline: 'Q2 2024',
        };

        const response = await request(app)
          .put(`/api/contacts/${testContactId}/custom-fields`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ customFields });

        expect(response.status).toBe(200);
        expect(response.body.customFields).toEqual(customFields);
      });

      it('should merge with existing custom fields', async () => {
        await db
          .update(contacts)
          .set({ customFields: { initial: 'value' } })
          .where(eq(contacts.id, testContactId));

        const response = await request(app)
          .put(`/api/contacts/${testContactId}/custom-fields`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ customFields: { additional: 'field' } });

        expect(response.status).toBe(200);
        expect(response.body.customFields).toEqual({
          initial: 'value',
          additional: 'field',
        });
      });
    });
  });

  describe('Activities', () => {
    describe('GET /api/contacts/:id/activities', () => {
      it('should return contact activities', async () => {
        await db.insert(contactActivities).values([
          {
            contactId: testContactId,
            activityType: 'email',
            description: 'Sent welcome email',
            direction: 'outbound',
          },
          {
            contactId: testContactId,
            activityType: 'call',
            description: 'Discovery call completed',
            direction: 'inbound',
          },
        ]);

        const response = await request(app)
          .get(`/api/contacts/${testContactId}/activities`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get(`/api/contacts/${testContactId}/activities?page=1&limit=5`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/contacts/:id/activities', () => {
      it('should create new activity', async () => {
        const activityData = {
          activityType: 'note',
          description: 'Important discussion about pricing',
          direction: 'inbound',
          metadata: { important: true },
        };

        const response = await request(app)
          .post(`/api/contacts/${testContactId}/activities`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(activityData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.activityType).toBe('note');
        expect(response.body.description).toBe(activityData.description);
      });

      it('should reject invalid activity data', async () => {
        const response = await request(app)
          .post(`/api/contacts/${testContactId}/activities`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            activityType: 'invalid_type',
            description: '',
          });

        expect(response.status).toBe(400);
      });
    });
  });
});
