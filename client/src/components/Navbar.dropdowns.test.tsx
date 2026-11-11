import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false, toggleTheme: vi.fn() }) }));
vi.mock('../contexts/WhitelabelContext', () => ({ useWhitelabel: () => ({ config: { companyName: 'Test' } }) }));
vi.mock('../contexts/NavigationContext', () => ({ useNavigation: () => ({ openAITool: vi.fn() }) }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ signOut: vi.fn(), user: { email: 'a@b.c' } }) }));
vi.mock('./RoleBasedAccess', () => ({ useRole: () => ({ canAccess: () => true }) }));
vi.mock('../contexts/NavbarPositionContext', () => ({
  useNavbarPosition: () => ({ position: 'top', isMinimized: false, toggleMinimized: vi.fn() }),
}));
vi.mock('../hooks/useAIApiKeys', () => ({ useAIApiKeys: () => ({ apiConfig: { openclaw: { apiKey: '' } } }) }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: () => ({ favorites: [] }) }));
vi.mock('./FavoritesSidebarSection', () => ({ default: () => <div data-testid="fav-section" /> }));
vi.mock('./NotificationCenter', () => ({ default: () => null }));
vi.mock('./DevBypassButton', () => ({ default: () => null }));
vi.mock('./OpenClawNavbarIndicator', () => ({ default: () => <span /> }));
vi.mock('./ModuleFederationAnalytics', () => ({ default: () => null }));

const setup = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe('Navbar dropdowns', () => {
  it.each([
    ['ai-tools', 'ai-tool-email-analysis'],
    ['communications', 'Phone System'],
    ['wl', 'White-Label Customization'],
    ['apps', 'internal-app-contacts'],
  ])('%s renders exactly one menu', (menuId, marker) => {
    setup();
    fireEvent.click(screen.getByTestId(`nav-${menuId}`));
    const hit = (m: string) =>
      m.includes('-') && !m.includes(' ')
        ? screen.queryAllByTestId(m)
        : screen.queryAllByText(m);
    expect(hit(marker)).toHaveLength(1);
  });

  it('Favorites shows the empty state', () => {
    setup();
    fireEvent.click(screen.getByTestId('nav-favorites'));
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
  });

  it('closes on outside click', () => {
    setup();
    fireEvent.click(screen.getByTestId('nav-communications'));
    expect(screen.getAllByText('Phone System')).toHaveLength(1);
    fireEvent.mouseDown(document.body);
    expect(screen.queryAllByText('Phone System')).toHaveLength(0);
  });

  it('search button opens the command menu via Ctrl+K', () => {
    const handler = vi.fn();
    document.addEventListener('keydown', handler);
    setup();
    fireEvent.click(screen.getByTestId('button-search'));
    document.removeEventListener('keydown', handler);
    expect(handler.mock.calls[0][0]).toMatchObject({ key: 'k', ctrlKey: true });
  });

  it('shows no hard-coded badge counts', () => {
    setup();
    expect(screen.getByTestId('nav-dashboard').textContent).toBe('Dashboard');
    expect(screen.getByTestId('nav-calendar').textContent).toBe('Calendar');
  });
});
