import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerCRMRoutes } from '../crm';

vi.mock('./auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    req.userId = 'test-user';
    next();
  },
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  and: vi.fn().mockReturnThis(),
  desc: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

vi.mock('../db', () => ({
  db: mockDb,
}));

describe('CRM Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contacts API', () => {
    it('GET /api/contacts returns list of contacts', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Doe', profileId: 'test-user' },
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
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Doe', profileId: 'test-user' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/contacts/1');
      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('John');
    });

    it('GET /api/contacts/:id returns 404 when contact not found', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/contacts/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contact not found');
    });

    it('POST /api/contacts creates new contact', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'Jane', lastName: 'Smith', profileId: 'test-user' },
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
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Doe', profileId: 'test-user' },
      ]);
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Smith', profileId: 'test-user' },
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
      mockDb.returning.mockResolvedValueOnce([]);

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
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', profileId: 'test-user' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).delete('/api/contacts/1');
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('DELETE /api/contacts/:id returns 404 when contact not found', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).delete('/api/contacts/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contact not found');
    });

    it('GET /api/contacts/duplicates returns duplicate groups', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '123', company: 'Acme', profileId: 'test-user' },
        { id: 2, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '456', company: 'Acme', profileId: 'test-user' },
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
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', profileId: 'test-user' },
      ]);
      mockDb.returning.mockResolvedValueOnce([
        { id: 2, firstName: 'John', lastName: 'Doe', email: 'john@test.com', profileId: 'test-user' },
      ]);
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', profileId: 'test-user' },
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
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, title: 'Deal 1', profileId: 'test-user' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/deals');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('GET /api/deals/:id returns single deal', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, title: 'Deal 1', profileId: 'test-user' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/deals/1');
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Deal 1');
    });

    it('POST /api/deals creates new deal', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, title: 'New Deal', profileId: 'test-user' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app)
        .post('/api/deals')
        .send({ title: 'New Deal', value: 50000 });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Deal');
    });
  });

  describe('Tasks API', () => {
    it('GET /api/tasks returns list of tasks', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, title: 'Task 1', profileId: 'test-user' },
      ]);

      const app = express();
      app.use(express.json());
      registerCRMRoutes(app);

      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('POST /api/tasks creates new task', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, title: 'New Task', profileId: 'test-user' },
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
});
