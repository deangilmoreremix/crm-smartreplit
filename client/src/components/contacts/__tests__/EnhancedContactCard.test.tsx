import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedContactCard from '../contacts/EnhancedContactCard';

// Mock the store functions
vi.mock('../../store/contactStore', () => ({
  useContactStore: () => ({
    analyzeContact: vi.fn(),
    enrichContact: vi.fn(),
    updateContact: vi.fn(),
  }),
}));

describe('Contact Enrichment Workflow Tests', () => {
  const mockContact = {
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

  let enrichContactMock;
  let analyzeContactMock;
  let updateContactMock;

  beforeEach(() => {
    enrichContactMock = useContactStore.mock.results[0].value.enrichContact;
    analyzeContactMock = useContactStore.mock.results[0].value.analyzeContact;
    updateContactMock = useContactStore.mock.results[0].value.updateContact;
    vi.clearAllMocks();
  });

  it('renders contact card with enrichment controls', () => {
    render(<EnhancedContactCard contact={mockContact} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('TechCorp Inc')).toBeInTheDocument();
    expect(screen.getByText('Enrich Data')).toBeInTheDocument();
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
  });

  it('triggers enrichment when button clicked', async () => {
    enrichContactMock.mockResolvedValue({ phone: '+1-555-0202', industry: 'Technology' });
    render(<EnhancedContactCard contact={mockContact} />);
    await userEvent.click(screen.getByText('Enrich Data'));
    await waitFor(() => expect(enrichContactMock).toHaveBeenCalledWith('ct-123'));
  });

  it('shows enriching state during operation', async () => {
    enrichContactMock.mockImplementation(() => new Promise(() => {}));
    render(<EnhancedContactCard contact={mockContact} />);
    await userEvent.click(screen.getByText('Enrich Data'));
    expect(screen.getByText('Enriching...')).toBeInTheDocument();
  });

  it('updates contact with enrichment results', async () => {
    const enrichment = { phone: '+1-555-0303', industry: 'Healthcare' };
    enrichContactMock.mockResolvedValue(enrichment);
    updateContactMock.mockResolvedValue({ ...mockContact, ...enrichment });
    render(<EnhancedContactCard contact={mockContact} />);
    await userEvent.click(screen.getByText('Enrich Data'));
    await waitFor(() => {
      expect(updateContactMock).toHaveBeenCalledWith('ct-123', enrichment);
    });
  });

  it('handles enrichment errors', async () => {
    enrichContactMock.mockRejectedValue(new Error('API Error'));
    render(<EnhancedContactCard contact={mockContact} />);
    await userEvent.click(screen.getByText('Enrich Data'));
    await waitFor(() => expect(enrichContactMock).toHaveBeenCalled());
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
