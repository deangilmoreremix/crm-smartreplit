import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

/**
 * Redirect that fills `:param` placeholders in `to` from the current route params and keeps any
 * incoming query string, e.g. <RedirectWithParams to="/tasks?id=:id" /> on /tasks/:id.
 */
export const RedirectWithParams: React.FC<{ to: string }> = ({ to }) => {
  const params = useParams();
  const { search } = useLocation();
  let target = to.replace(/:([A-Za-z0-9_]+)/g, (_m, key: string) => encodeURIComponent(params[key] ?? ''));
  if (search) target += (target.includes('?') ? '&' : '?') + search.slice(1);
  return <Navigate to={target} replace />;
};

export default RedirectWithParams;
