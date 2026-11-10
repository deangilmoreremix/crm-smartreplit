import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerCRMRoutes } from '../crm';
import { insertNoteSchema, updateNoteSchema } from '../../../shared/schema';

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    req.userId = '11111111-1111-4111-8111-111111111111';
    next();
  },
}));

// Drizzle-style fake: every chained call returns the same thenable chain, and each `await`
// consumes the next queued result (default: empty list). Queue results in the order the
// route awaits queries.
const { queue, mockDb } = vi.hoisted(() => {
  const queue: unknown[] = [];
  const chain: any = {};
  for (const m of [
    'select', 'from', 'where', 'orderBy', 'limit', 'insert', 'values', 'update', 'set',
    'delete', 'returning',
  ]) {
    chain[m] = () => chain;
  }
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(queue.length ? queue.shift() : []).then(resolve, reject);
  return { queue, mockDb: chain };
});
const queueDb = (...results: unknown[]) => queue.push(...results);

vi.mock('../../db', () => ({
  db: mockDb,
}));

describe('CRM Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queue.length = 0;
  });

  describe('Contacts API', () => {
    it('GET /api/contacts returns list of contacts', async () => {
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Doe', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].firstName).toBe('John');
    });

    it('GET /api/contacts/:id returns single contact', async () => {
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Doe', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/contacts/1');
      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('John');
    });

    it('GET /api/contacts/:id returns 404 when contact not found', async () => {
      queueDb([]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/contacts/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contact not found');
    });

    it('POST /api/contacts creates new contact', async () => {
      queueDb([
        { id: 1, firstName: 'Jane', lastName: 'Smith', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/contacts')
        .send({ firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' });

      expect(response.status).toBe(201);
      expect(response.body.firstName).toBe('Jane');
    });

    it('POST /api/contacts rejects invalid data with 400', async () => {
      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/contacts')
        .send({});

      expect(response.status).toBe(400);
    });

    it('PUT /api/contacts/:id updates existing contact', async () => {
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Doe', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Smith', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .put('/api/contacts/1')
        .send({ lastName: 'Smith' });

      expect(response.status).toBe(200);
      expect(response.body.lastName).toBe('Smith');
    });

    it('PUT /api/contacts/:id returns 404 when contact not found', async () => {
      queueDb([]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .put('/api/contacts/999')
        .send({ lastName: 'Smith' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contact not found');
    });

    it('DELETE /api/contacts/:id deletes contact', async () => {
      queueDb([
        { id: 1, firstName: 'John', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).delete('/api/contacts/1');
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('DELETE /api/contacts/:id returns 404 when contact not found', async () => {
      queueDb([]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).delete('/api/contacts/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contact not found');
    });

    it('GET /api/contacts/duplicates returns duplicate groups', async () => {
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '123', company: 'Acme', profileId: '11111111-1111-4111-8111-111111111111' },
        { id: 2, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '456', company: 'Acme', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/contacts/duplicates');
      expect(response.status).toBe(200);
      expect(response.body.duplicates).toBeDefined();
      expect(response.body.duplicates.length).toBeGreaterThan(0);
    });

    it('POST /api/contacts/merge merges two contacts', async () => {
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);
      queueDb([
        { id: 2, firstName: 'John', lastName: 'Doe', email: 'john@test.com', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);
      queueDb([
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/contacts/merge')
        .send({ primaryId: 1, duplicateId: 2 });

      expect(response.status).toBe(200);
      expect(response.body.merged).toBe(true);
    });

    it('POST /api/contacts/merge rejects same contact', async () => {
      // the route loads both contacts before comparing ids
      queueDb([{ id: 1, profileId: '11111111-1111-4111-8111-111111111111' }], [{ id: 1, profileId: '11111111-1111-4111-8111-111111111111' }]);
      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/contacts/merge')
        .send({ primaryId: 1, duplicateId: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot merge a contact with itself');
    });
  });

  describe('Deals API', () => {
    it('GET /api/deals returns list of deals', async () => {
      queueDb([
        { id: 1, title: 'Deal 1', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/deals');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('GET /api/deals/:id returns single deal', async () => {
      queueDb([
        { id: 1, title: 'Deal 1', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/deals/1');
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Deal 1');
    });

    it('POST /api/deals creates new deal', async () => {
      queueDb([
        { id: 1, title: 'New Deal', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/deals')
        .send({ title: 'New Deal', value: '50000', stage: 'lead' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Deal');
    });
  });

  describe('Tasks API', () => {
    it('GET /api/tasks returns list of tasks', async () => {
      queueDb([
        { id: 1, title: 'Task 1', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('POST /api/tasks creates new task', async () => {
      queueDb([
        { id: 1, title: 'New Task', profileId: '11111111-1111-4111-8111-111111111111' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'New Task', status: 'pending' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Task');
    });
  });

  describe('Rich notes', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] };

    it('insert/update schemas keep body_json and body_text instead of stripping them', () => {
      const ins = insertNoteSchema.parse({ content: 'hi', body_json: doc, body_text: 'hi', profileId: '11111111-1111-4111-8111-111111111111' });
      expect(ins.body_json).toEqual(doc);
      expect(ins.body_text).toBe('hi');
      const upd = updateNoteSchema.parse({ body_json: doc, body_text: 'hi' });
      expect(upd.body_json).toEqual(doc);
    });

    it('plain notes without rich columns still validate', () => {
      const ins = insertNoteSchema.parse({ content: 'plain', profileId: '11111111-1111-4111-8111-111111111111' });
      expect(ins.body_json).toBeUndefined();
    });

    it('POST /api/notes accepts a rich body and returns it', async () => {
      queueDb([{ id: 'n1', content: 'hi', body_json: doc, body_text: 'hi' }]);
      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);
      const res = await request(app).post('/api/notes').send({ content: 'hi', body_json: doc, body_text: 'hi' });
      expect(res.status).toBe(201);
      expect(res.body.body_json).toEqual(doc);
    });
  });
});
