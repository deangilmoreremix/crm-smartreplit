import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LeadScoringVisualization from '../contacts/LeadScoringVisualization';

vi.mock('../../store/contactStore', () => ({
  useContactStore: () => ({
    contacts: {
      'ct-1': {
        id: 'ct-1',
        name: 'Alice Johnson',
        email: 'alice@company.com',
        phone: '+1-555-1111',
        company: 'Big Corp',
        position: 'CEO',
        aiScore: 92,
        status: 'prospect',
        interestLevel: 'hot',
        isFavorite: true,
        lastContact: '2024-01-20',
        socialProfiles: {},
        customFields: {},
        tags: ['enterprise', 'high-value'],
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-22T15:30:00Z',
      },
      'ct-2': {
        id: 'ct-2',
        name: 'Bob Smith',
        email: 'bob@company.com',
        phone: '+1-555-2222',
        company: 'Medium Inc',
        position: 'Manager',
        aiScore: 65,
        status: 'customer',
        interestLevel: 'medium',
        isFavorite: false,
        lastContact: '2024-01-18',
        socialProfiles: {},
        customFields: {},
        tags: ['standard'],
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-19T15:30:00Z',
      },
      'ct-3': {
        id: 'ct-3',
        name: 'Carol White',
        email: 'carol@company.com',
        phone: '+1-555-3333',
        company: 'Small LLC',
        position: 'Owner',
        aiScore: 40,
        status: 'lead',
        interestLevel: 'cold',
        isFavorite: false,
        lastContact: '2024-01-10',
        socialProfiles: {},
        customFields: {},
        tags: ['startup'],
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-15T15:30:00Z',
      },
    },
    getFilteredContacts: () =>
      Object.values(
        {
          'ct-1': {
            id: 'ct-1',
            name: 'Alice Johnson',
            email: 'alice@company.com',
            phone: '+1-555-1111',
            company: 'Big Corp',
            position: 'CEO',
            aiScore: 92,
            status: 'prospect',
            interestLevel: 'hot',
            isFavorite: true,
            lastContact: '2024-01-20',
            socialProfiles: {},
            customFields: {},
            tags: ['enterprise', 'high-value'],
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-22T15:30:00Z',
          },
          'ct-2': {
            id: 'ct-2',
            name: 'Bob Smith',
            email: 'bob@company.com',
            phone: '+1-555-2222',
            company: 'Medium Inc',
            position: 'Manager',
            aiScore: 65,
            status: 'customer',
            interestLevel: 'medium',
            isFavorite: false,
            lastContact: '2024-01-18',
            socialProfiles: {},
            customFields: {},
            tags: ['standard'],
            createdAt: '2024-01-05T10:00:00Z',
            updatedAt: '2024-01-19T15:30:00Z',
          },
          'ct-3': {
            id: 'ct-3',
            name: 'Carol White',
            email: 'carol@company.com',
            phone: '+1-555-3333',
            company: 'Small LLC',
            position: 'Owner',
            aiScore: 40,
            status: 'lead',
            interestLevel: 'cold',
            isFavorite: false,
            lastContact: '2024-01-10',
            socialProfiles: {},
            customFields: {},
            tags: ['startup'],
            createdAt: '2024-01-03T10:00:00Z',
            updatedAt: '2024-01-15T15:30:00Z',
          },
        }()
      ),
  }),
}));

describe('Lead Scoring Visualization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lead scoring dashboard', () => {
    render(<LeadScoringVisualization />);
    expect(screen.getByText('Lead Scoring Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/AI Score/i)).toBeInTheDocument();
  });

  it('displays high score contacts', () => {
    render(<LeadScoringVisualization />);
    expect(screen.getByText(/Alice Johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/92/i)).toBeInTheDocument();
  });

  it('displays medium score contacts', () => {
    render(<LeadScoringVisualization />);
    expect(screen.getByText(/Bob Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/65/i)).toBeInTheDocument();
  });

  it('displays low score contacts', () => {
    render(<LeadScoringVisualization />);
    expect(screen.getByText(/Carol White/i)).toBeInTheDocument();
    expect(screen.getByText(/40/i)).toBeInTheDocument();
  });

  it('sorts contacts by score descending', () => {
    render(<LeadScoringVisualization />);
    const rows = screen.getAllByRole('row');
    // Verify highest score appears first
    expect(rows[0]).toContainElement(screen.getByText(/92/i));
  });

  it('shows AI-generated insights', () => {
    render(<LeadScoringVisualization />);
    const insightButton = screen.getByText(/AI Insights/i);
    expect(insightButton).toBeInTheDocument();
  });

  it('allows filtering by score range', () => {
    render(<LeadScoringVisualization />);
    const filterSelect = screen.getByLabelText(/Filter by score/i);
    expect(filterSelect).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<LeadScoringVisualization />);
    expect(screen.getByText(/Prospect/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead/i)).toBeInTheDocument();
  });

  it('updates scores when data changes', async () => {
    render(<LeadScoringVisualization />);
    await waitFor(() => {
      expect(screen.getByText(/92/i)).toBeInTheDocument();
    });
  });
});
