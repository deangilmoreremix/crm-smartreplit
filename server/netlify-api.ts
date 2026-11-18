/**
 * Netlify Function entry for the Express API.
 * netlify.toml rewrites /api/* to this function; requests keep their original /api/... path.
 */
import serverless from 'serverless-http';
import { app, appReady } from './app';

const serverlessHandler = serverless(app, {
  request(req: any) {
    // Direct calls to /.netlify/functions/api/<x> are mapped to /api/<x>
    req.url = req.url.replace(/^\/\.netlify\/functions\/api(?=\/|\?|$)/, '/api');
  },
});

export const handler = async (event: any, context: any) => {
  await appReady;
  return serverlessHandler(event, context);
};
