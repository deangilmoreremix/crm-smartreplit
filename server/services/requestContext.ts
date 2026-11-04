import { AsyncLocalStorage } from 'async_hooks';

/** Per-request context, so deep helpers can find the signed-in user without threading userId through every call. */
export interface RequestContext {
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function currentUserId(): string | undefined {
  return requestContext.getStore()?.userId;
}
