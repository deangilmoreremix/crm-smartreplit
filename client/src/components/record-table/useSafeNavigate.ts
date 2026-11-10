import { useCallback } from 'react';
import { useInRouterContext, useNavigate } from 'react-router-dom';

/** `navigate` that falls back to a full page load when rendered outside a Router (e.g. in unit tests). */
export function useSafeNavigate(): (to: string) => void {
  const inRouter = useInRouterContext();
  // The router context never changes for a mounted component, so the hook order is stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = inRouter ? useNavigate() : null;
  return useCallback((to: string) => (navigate ? navigate(to) : window.location.assign(to)), [navigate]);
}
