import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RedirectWithParams } from '../RedirectWithParams';

const Loc = () => {
  const l = useLocation();
  return <div data-testid="loc">{l.pathname + l.search}</div>;
};

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/tasks/:id" element={<RedirectWithParams to="/tasks?id=:id" />} />
        <Route path="/interactions/:id" element={<RedirectWithParams to="/contacts/:id" />} />
        <Route path="/deals" element={<RedirectWithParams to="/pipeline" />} />
        <Route path="*" element={<Loc />} />
      </Routes>
    </MemoryRouter>
  );

describe('RedirectWithParams', () => {
  it('substitutes route params into a query string', () => {
    renderAt('/tasks/42');
    expect(screen.getByTestId('loc')).toHaveTextContent('/tasks?id=42');
  });
  it('substitutes route params into a path', () => {
    renderAt('/interactions/7');
    expect(screen.getByTestId('loc')).toHaveTextContent('/contacts/7');
  });
  it('keeps the incoming query string', () => {
    renderAt('/deals?stage=won');
    expect(screen.getByTestId('loc')).toHaveTextContent('/pipeline?stage=won');
  });
});
