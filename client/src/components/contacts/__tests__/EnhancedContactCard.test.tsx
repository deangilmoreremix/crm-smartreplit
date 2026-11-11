import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedContactCard from '../EnhancedContactCard';

// Mock the store functions
const { enrichContactMock, analyzeContactMock, updateContactMock } = vi.hoisted(() => ({
  enrichContactMock: vi.fn(),
  analyzeContactMock: vi.fn(),
  updateContactMock: vi.fn(),
}));

vi.mock('../../../store/contactStore', () => ({
  useContactStore: () => ({
    analyzeContact: analyzeContactMock,
    enrichContact: enrichContactMock,
    updateContact: updateContactMock,
  }),
}));

vi.mock('../../../services/gpt5SocialResearchService', () => ({
  gpt5SocialResearchService: { researchContactSocialMedia: vi.fn() },
}));

describe('Contact Enrichment Workflow Tests', () => {
  const mockContact: any = {
    id: 'ct-123',
    name: 'Jane Doe',
    email: 'jane.doe@company.com',
    phone: '+1-555-0101',
    company: 'TechCorp Inc',
    position: 'CTO',
    aiScore: 78,
    status: 'prospect',
    interestLevel: 'medium',
    isFavorite: false,
    lastContact: '2024-01-15',
    socialProfiles: { linkedin: 'https://linkedin.com/in/janedoe' },
    customFields: {},
    tags: ['enterprise', 'tech'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  };

  beforeEach(() => {
    enrichContactMock.mockReset();
    analyzeContactMock.mockReset();
    updateContactMock.mockReset();
  });

  // Enrichment / analysis actions live in the "more actions" dropdown
  const openMenu = async () => {
    const buttons = screen.getAllByRole('button');
    // Favorite star is first, the actions menu toggle is second
    await userEvent.click(buttons[1]);
  };

  it('renders contact card with enrichment controls', async () => {
    render(<EnhancedContactCard contact={mockContact} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/TechCorp Inc/)).toBeInTheDocument();
    await openMenu();
    expect(screen.getByText('Enrich Data')).toBeInTheDocument();
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
  });

  it('triggers enrichment when button clicked', async () => {
    enrichContactMock.mockResolvedValue({ phone: '+1-555-0202', industry: 'Technology' });
    render(<EnhancedContactCard contact={mockContact} />);
    await openMenu();
    await userEvent.click(screen.getByText('Enrich Data'));
    await waitFor(() => expect(enrichContactMock).toHaveBeenCalledWith('ct-123'));
  });

  it('shows enriching state during operation', async () => {
    enrichContactMock.mockImplementation(() => new Promise(() => {}));
    render(<EnhancedContactCard contact={mockContact} />);
    await openMenu();
    await userEvent.click(screen.getByText('Enrich Data'));
    await openMenu();
    expect(screen.getByText('Enriching...')).toBeInTheDocument();
  });

  it('toggles favorite through updateContact', async () => {
    render(<EnhancedContactCard contact={mockContact} />);
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(updateContactMock).toHaveBeenCalledWith('ct-123', { isFavorite: true });
  });

  it('triggers AI analysis from the menu', async () => {
    analyzeContactMock.mockResolvedValue(undefined);
    render(<EnhancedContactCard contact={mockContact} />);
    await openMenu();
    await userEvent.click(screen.getByText('AI Analysis'));
    await waitFor(() => expect(analyzeContactMock).toHaveBeenCalledWith('ct-123'));
  });

  it('handles enrichment errors', async () => {
    enrichContactMock.mockRejectedValue(new Error('API Error'));
    render(<EnhancedContactCard contact={mockContact} />);
    await openMenu();
    await userEvent.click(screen.getByText('Enrich Data'));
    await waitFor(() => expect(enrichContactMock).toHaveBeenCalled());
    // Error is swallowed by the card and the button recovers
    await openMenu();
    await waitFor(() => expect(screen.getByText('Enrich Data')).toBeInTheDocument());
  });

  it('displays AI score badge', () => {
    render(<EnhancedContactCard contact={mockContact} />);
    expect(screen.getByText(/78.*Medium/i)).toBeInTheDocument();
  });

  it('shows social profile links', () => {
    render(<EnhancedContactCard contact={mockContact} />);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/janedoe');
  });
});
