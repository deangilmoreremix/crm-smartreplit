/**
 * Netlify functions run Node 20, which has no global WebSocket. The Supabase client builds its realtime
 * client at construction time and throws "Node.js 20 detected without native WebSocket support" without one,
 * which crashed the whole API on startup. The server never uses realtime subscriptions, so a stand-in that
 * fails loudly if anything does try to connect is enough. Import this first, before anything that creates a
 * Supabase client.
 */
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class UnavailableWebSocket {
    constructor() {
      throw new Error('WebSocket is not available in this runtime; Supabase realtime is not supported on the server');
    }
  };
}

export {};
