import type { Express } from "express";
import { eq, and, desc } from 'drizzle-orm';
import {
  contacts,
  deals,
  tasks,
  appointments,
  communications,
  notes,
  documents,
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertAppointmentSchema,
  insertCommunicationSchema,
  insertNoteSchema,
  updateNoteSchema,
  insertDocumentSchema
} from '../../shared/schema.js';
import { requireAuth, requireProductTier } from './auth';

export function registerCRMRoutes(app: Express): void {
  // ==================== CONTACTS API ====================

  // Get all contacts for the authenticated user
  app.get('/api/contacts', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.profileId, userId))
        .orderBy(desc(contacts.createdAt));

      res.json(userContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  // Get a single contact
  app.get('/api/contacts/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const contactId = parseInt(req.params.id);
      const [contact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ error: 'Failed to fetch contact' });
    }
  });

  // Create a new contact
  app.post('/api/contacts', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertContactSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newContact] = await db
        .insert(contacts)
        .values(validatedData)
        .returning();

      res.status(201).json(newContact);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create contact' });
    }
  });

  // Update a contact
  app.put('/api/contacts/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const contactId = parseInt(req.params.id);

      // Verify contact belongs to user
      const [existingContact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

      if (!existingContact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const [updatedContact] = await db
        .update(contacts)
        .set({
          ...req.body,
          profileId: userId,
          updatedAt: new Date()
        })
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
        .returning();

      res.json(updatedContact);
    } catch (error: any) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  });

  // Delete a contact
  app.delete('/api/contacts/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const contactId = parseInt(req.params.id);

      const [deletedContact] = await db
        .delete(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
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

  // ==================== DEALS API ====================

  // Get all deals for the authenticated user
  app.get('/api/deals', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userDeals = await db
        .select()
        .from(deals)
        .where(eq(deals.profileId, userId))
        .orderBy(desc(deals.createdAt));

      res.json(userDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  });

  // Get a single deal
  app.get('/api/deals/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const dealId = parseInt(req.params.id);
      const [deal] = await db
        .select()
        .from(deals)
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)));

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  });

  // Create a new deal
  app.post('/api/deals', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertDealSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newDeal] = await db
        .insert(deals)
        .values(validatedData)
        .returning();

      res.status(201).json(newDeal);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create deal' });
    }
  });

  // Update a deal
  app.put('/api/deals/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const dealId = parseInt(req.params.id);

      // Verify deal belongs to user
      const [existingDeal] = await db
        .select()
        .from(deals)
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)));

      if (!existingDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      const [updatedDeal] = await db
        .update(deals)
        .set({
          ...req.body,
          profileId: userId,
          updatedAt: new Date()
        })
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
        .returning();

      res.json(updatedDeal);
    } catch (error: any) {
      console.error('Error updating deal:', error);
      res.status(500).json({ error: 'Failed to update deal' });
    }
  });

  // Delete a deal
  app.delete('/api/deals/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const dealId = parseInt(req.params.id);

      const [deletedDeal] = await db
        .delete(deals)
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
        .returning();

      if (!deletedDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json({ message: 'Deal deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  });

  // ==================== TASKS API ====================

  // Get all tasks for the authenticated user
  app.get('/api/tasks', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.profileId, userId))
        .orderBy(desc(tasks.createdAt));

      res.json(userTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get a single task
  app.get('/api/tasks/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const taskId = parseInt(req.params.id);
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)));

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Create a new task
  app.post('/api/tasks', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newTask] = await db
        .insert(tasks)
        .values(validatedData)
        .returning();

      res.status(201).json(newTask);
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update a task
  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const taskId = parseInt(req.params.id);

      // Verify task belongs to user
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)));

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Validate and sanitize update data
      const validatedData = insertTaskSchema.parse(req.body);

      const [updatedTask] = await db
        .update(tasks)
        .set({
          ...validatedData,
          profileId: userId, // Explicitly set to prevent privilege escalation
          updatedAt: new Date()
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId))) // Double-check ownership
        .returning();

      res.json(updatedTask);
    } catch (error: any) {
      console.error('Error updating task:', error);
      // Differentiate validation errors from server errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const taskId = parseInt(req.params.id);

      const [deletedTask] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)))
        .returning();

      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // ==================== APPOINTMENTS API ====================

  // Get all appointments for the authenticated user
  app.get('/api/appointments', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userAppointments = await db
        .select()
        .from(appointments)
        .where(eq(appointments.profileId, userId))
        .orderBy(desc(appointments.startTime));

      res.json(userAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  // Get a single appointment
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const appointmentId = parseInt(req.params.id);
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)));

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  });

  // Create a new appointment
  app.post('/api/appointments', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newAppointment] = await db
        .insert(appointments)
        .values(validatedData)
        .returning();

      res.status(201).json(newAppointment);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  });

  // Update an appointment
  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const appointmentId = parseInt(req.params.id);

      // Verify appointment belongs to user
      const [existingAppointment] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)));

      if (!existingAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Validate and sanitize update data
      const validatedData = insertAppointmentSchema.parse(req.body);

      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          ...validatedData,
          profileId: userId, // Explicitly set to prevent privilege escalation
          updatedAt: new Date()
        })
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId))) // Double-check ownership
        .returning();

      res.json(updatedAppointment);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      // Differentiate validation errors from server errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  });

  // Delete an appointment
  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const appointmentId = parseInt(req.params.id);

      const [deletedAppointment] = await db
        .delete(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)))
        .returning();

      if (!deletedAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({ message: 'Appointment deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  });

  // ==================== COMMUNICATIONS API ====================

  // Get all communications for the authenticated user
  app.get('/api/communications', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userCommunications = await db
        .select()
        .from(communications)
        .where(eq(communications.profileId, userId))
        .orderBy(desc(communications.createdAt));

      res.json(userCommunications);
    } catch (error) {
      console.error('Error fetching communications:', error);
      res.status(500).json({ error: 'Failed to fetch communications' });
    }
  });

  // Create a new communication
  app.post('/api/communications', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertCommunicationSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newCommunication] = await db
        .insert(communications)
        .values(validatedData)
        .returning();

      res.status(201).json(newCommunication);
    } catch (error: any) {
      console.error('Error creating communication:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create communication' });
    }
  });

  // ==================== NOTES API ====================

  // Get all notes for the authenticated user
  app.get('/api/notes', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.profileId, userId))
        .orderBy(desc(notes.createdAt));

      res.json(userNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Get notes by contact
  app.get('/api/notes/contact/:contactId', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const contactId = parseInt(req.params.contactId);
      const contactNotes = await db
        .select()
        .from(notes)
        .where(and(eq(notes.contactId, contactId), eq(notes.profileId, userId)))
        .orderBy(desc(notes.createdAt));

      res.json(contactNotes);
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Get notes by deal
  app.get('/api/notes/deal/:dealId', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const dealId = parseInt(req.params.dealId);
      const dealNotes = await db
        .select()
        .from(notes)
        .where(and(eq(notes.dealId, dealId), eq(notes.profileId, userId)))
        .orderBy(desc(notes.createdAt));

      res.json(dealNotes);
    } catch (error) {
      console.error('Error fetching deal notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Create a new note
  app.post('/api/notes', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertNoteSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newNote] = await db
        .insert(notes)
        .values(validatedData)
        .returning();

      res.status(201).json(newNote);
    } catch (error: any) {
      console.error('Error creating note:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // Update a note
  app.put('/api/notes/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const noteId = parseInt(req.params.id);

      // Verify note belongs to user
      const [existingNote] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.profileId, userId)));

      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Validate and sanitize update data
      const validatedData = updateNoteSchema.parse(req.body);

      const [updatedNote] = await db
        .update(notes)
        .set({
          ...validatedData,
          profileId: userId, // Explicitly set to prevent privilege escalation
          updatedAt: new Date()
        })
        .where(and(eq(notes.id, noteId), eq(notes.profileId, userId))) // Double-check ownership
        .returning();

      res.json(updatedNote);
    } catch (error: any) {
      console.error('Error updating note:', error);
      // Differentiate validation errors from server errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update note' });
    }
  });

  // Delete a note
  app.delete('/api/notes/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const noteId = parseInt(req.params.id);

      const [deletedNote] = await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.profileId, userId)))
        .returning();

      if (!deletedNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json({ message: 'Note deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // ==================== DOCUMENTS API ====================

  // Get all documents for the authenticated user
  app.get('/api/documents', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const userDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.profileId, userId))
        .orderBy(desc(documents.createdAt));

      res.json(userDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  // Create a new document
  app.post('/api/documents', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newDocument] = await db
        .insert(documents)
        .values(validatedData)
        .returning();

      res.status(201).json(newDocument);
    } catch (error: any) {
      console.error('Error creating document:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create document' });
    }
  });

  // Delete a document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { db } = await import('../db');
      const documentId = parseInt(req.params.id);

      const [deletedDocument] = await db
        .delete(documents)
        .where(and(eq(documents.id, documentId), eq(documents.profileId, userId)))
        .returning();

      if (!deletedDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });
}