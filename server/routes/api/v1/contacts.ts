import { Router } from 'express';
import { eq, and, desc, like, or } from 'drizzle-orm';
import {
  contacts,
  contactActivities,
  insertContactSchema,
  updateContactSchema,
} from '../../../shared/schema.js';
import { webhookService } from '../../../server/services/webhook.js';

const router = Router();

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  productTier: string;
}

const checkAuth = (
  req: any
): { userId: string | null; isAuthenticated: boolean; user?: AuthUser } => {
  const userId = (req.session as any)?.userId;
  const authHeader = req.headers.authorization;
  const hostname = req.headers.host || '';
  const isDevHost =
    hostname.includes('localhost') ||
    hostname.includes('replit.dev') ||
    hostname.includes('127.0.0.1');

  if (userId) {
    return { userId, isAuthenticated: true, user: (req.session as any)?.user };
  }

  if (process.env.NODE_ENV === 'development' && isDevHost && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.startsWith('dev-bypass-token-')) {
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin',
      };
      return { userId: 'dev-user-12345', isAuthenticated: true, user: req.user };
    }
  }

  return { userId: null, isAuthenticated: false };
};

router.get('/', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const { page = '1', limit = '50', search, status, source } = req.query;

    let query = db.select().from(contacts).where(eq(contacts.profileId, userId!));

    if (search) {
      const searchTerm = `%${search}%`;
      query = db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.profileId, userId!),
            or(
              like(contacts.firstName, searchTerm),
              like(contacts.lastName, searchTerm),
              like(contacts.email, searchTerm),
              like(contacts.company, searchTerm)
            )
          )
        );
    } else if (status) {
      query = db
        .select()
        .from(contacts)
        .where(and(eq(contacts.profileId, userId!), eq(contacts.status, status as string)));
    } else if (source) {
      query = db
        .select()
        .from(contacts)
        .where(and(eq(contacts.profileId, userId!), eq(contacts.source, source as string)));
    }

    const allContacts = await query.orderBy(desc(contacts.createdAt));
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const start = (pageNum - 1) * limitNum;
    const paginatedContacts = allContacts.slice(start, start + limitNum);

    res.json({
      data: paginatedContacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allContacts.length,
        totalPages: Math.ceil(allContacts.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const validatedData = insertContactSchema.parse({
      ...req.body,
      profileId: userId,
    });

    const [newContact] = await db.insert(contacts).values(validatedData).returning();

    webhookService
      .dispatchEvent(userId!, 'contact_created', {
        contact: newContact,
      })
      .catch((err) => console.error('Webhook dispatch error:', err));

    res.status(201).json(newContact);
  } catch (error: any) {
    console.error('Error creating contact:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const validatedData = updateContactSchema.parse(req.body);

    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)))
      .returning();

    res.json(updatedContact);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [deletedContact] = await db
      .delete(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)))
      .returning();

    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

router.get('/:id/activities', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const activities = await db
      .select()
      .from(contactActivities)
      .where(eq(contactActivities.contactId, contactId))
      .orderBy(desc(contactActivities.createdAt));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching contact activities:', error);
    res.status(500).json({ error: 'Failed to fetch contact activities' });
  }
});

router.post('/:id/activities', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { activityType, description, metadata } = req.body;

    const [newActivity] = await db
      .insert(contactActivities)
      .values({
        contactId,
        activityType,
        description,
        metadata: metadata || {},
      })
      .returning();

    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Error creating contact activity:', error);
    res.status(500).json({ error: 'Failed to create contact activity' });
  }
});

router.post('/:id/enrich', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const [updatedContact] = await db
      .update(contacts)
      .set({
        lastEnrichedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    res.json({
      message: 'Contact enrichment triggered',
      contact: updatedContact,
    });
  } catch (error) {
    console.error('Error enriching contact:', error);
    res.status(500).json({ error: 'Failed to enrich contact' });
  }
});

router.post('/:id/score', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      message: 'Contact scoring triggered',
      contactId,
    });
  } catch (error) {
    console.error('Error scoring contact:', error);
    res.status(500).json({ error: 'Failed to score contact' });
  }
});

router.put('/:id/custom-fields', async (req, res) => {
  try {
    const { userId, isAuthenticated } = checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await import('../../../server/db');
    const contactId = parseInt(req.params.id);

    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId!)));

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { customFields } = req.body;

    const [updatedContact] = await db
      .update(contacts)
      .set({
        customFields,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating custom fields:', error);
    res.status(500).json({ error: 'Failed to update custom fields' });
  }
});

export default router;
