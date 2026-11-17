/**
 * Netlify scheduled function (daily, see netlify.toml): creates the CRM tasks for every
 * lead automation campaign step that is due, for all users.
 */
import { db } from './db';
import { processDueSteps } from './services/leadAutomation';

export const handler = async () => {
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Database not configured' }) };
  }
  try {
    const tasksCreated = await processDueSteps();
    console.log(`lead-automation-tick: created ${tasksCreated} task(s)`);
    return { statusCode: 200, body: JSON.stringify({ tasksCreated }) };
  } catch (error: any) {
    console.error('lead-automation-tick failed:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || 'Failed' }) };
  }
};
