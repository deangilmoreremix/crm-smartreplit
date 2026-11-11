import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIEnhancedContactCard } from '../components/contacts/AIEnhancedContactCard';
import { Contact } from '../types';

// Mock the stores and services
const { updateContactMock, enrichContactMock, researchMock } = vi.hoisted(() => ({
  updateContactMock: vi.fn(),
  enrichContactMock: vi.fn(),
  researchMock: vi.fn(),
}));

vi.mock('../store/contactStore', () => ({
  useContactStore: () => ({
    updateContact: updateContactMock,
  }),
}));

// The real OpenClawService builds a Supabase client and axios instance on construction;
// unit tests of the card only care about the calls the card makes to it.
vi.mock('@crm/openclaw-api', () => ({
  OpenClawService: class {
    enrichContact = enrichContactMock;
  },
}));

vi.mock('../services/aiEnrichmentService', () => ({
  aiEnrichmentService: {
    enrichContact: vi.fn(),
  },
}));

vi.mock('../services/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../services/http-client.service', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

vi.mock('../services/gpt5SocialResearchService', () => ({
  gpt5SocialResearchService: {
    researchContactSocialMedia: researchMock,
  },
}));

vi.mock('../contexts/AIContext', () => ({
  useContactAI: () => ({
    analyzeContact: vi.fn(),
  }),
}));

// Mock the UI components
vi.mock('../components/ui/AvatarWithStatus', () => ({
  AvatarWithStatus: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/ui/CustomizableAIToolbar', () => ({
  CustomizableAIToolbar: () => <div>AI Toolbar</div>,
}));

vi.mock('../components/AIImageModal', () => ({
  default: () => <div>AI Image Modal</div>,
}));

const mockContact: Contact = {
  id: '1',
  name: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Example Corp',
  position: 'CEO',
  status: 'lead',
  source: 'LinkedIn',
  leadScore: 75,
  engagementScore: 80,
  aiScore: 85,
  lastContacted: new Date('2024-01-15'),
  lastActivity: new Date('2024-01-20'),
  socialProfiles: { linkedin: 'https://linkedin.com/in/johndoe' },
  customFields: { budget: '$100k', timeline: '3 months' },
  tags: ['VIP', 'Enterprise'],
  notes: 'High priority lead',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-20'),
  activityLog: [],
  nextSendDate: new Date('2024-01-25'),
  isTeamMember: false,
  role: 'sales-rep',
  gamificationStats: {},
  title: 'CEO',
  avatarSrc: 'https://example.com/avatar.jpg',
  industry: 'Technology',
  department: 'Executive',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  country: 'USA',
  zipCode: '12345',
  timezone: 'PST',
  sources: ['LinkedIn'],
  interestLevel: 'hot',
  lastConnected: new Date('2024-01-18'),
  isFavorite: true,
  birthday: new Date('1980-01-01'),
  preferredContact: 'email',
  isMockData: false,
  isExample: false,
  dataSource: 'real',
  createdBy: 'user',
  mockDataType: undefined,
  userId: 'user-1',
  psychologicalProfile: {},
  aiScoreRationale: {
    score: 85,
    reasoning: 'High engagement, large company, decision maker',
    strengths: ['Decision maker', 'High engagement'],
    weaknesses: ['Long sales cycle'],
    recommendations: ['Schedule demo', 'Send case studies'],
  },
  behavioralInsights: {},
  lastEnrichment: {
    timestamp: new Date('2024-01-20'),
    source: 'OpenAI',
    data: {
      companySize: '500+',
      industry: 'Technology',
      socialProfiles: { linkedin: 'https://linkedin.com/in/johndoe' },
    },
  },
};

const renderCard = (overrides: Partial<Contact> = {}, props: Record<string, unknown> = {}) =>
  render(
    <AIEnhancedContactCard
      contact={{ ...mockContact, ...overrides }}
      isSelected={false}
      onSelect={() => {}}
      onClick={() => {}}
      {...props}
    />
  );

describe('AIEnhancedContactCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateContactMock.mockReset();
    enrichContactMock.mockReset();
    researchMock.mockReset();
  });

  it('renders contact information correctly', () => {
    renderCard();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('Example Corp')).toBeInTheDocument();
  });

  it('opens an email draft to the contact', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /email/i }));
    expect(open).toHaveBeenCalledWith('mailto:john@example.com', '_blank');
    open.mockRestore();
  });

  it('displays AI score with correct color', () => {
    renderCard();

    // 85 is a high score, should be green
    const scoreElement = screen.getByText('85');
    expect(scoreElement).toBeInTheDocument();
    expect(scoreElement.closest('div')).toHaveClass('bg-green-500');
    expect(screen.getByText('AI Score')).toBeInTheDocument();
  });

  it('prompts for a score when the contact has none', () => {
    renderCard({ aiScore: undefined });

    expect(screen.getByText('Click to Score')).toBeInTheDocument();
    expect(screen.getByTitle('Click to get AI score')).toBeInTheDocument();
  });

  it('shows score-based AI insights', () => {
    renderCard();

    expect(
      screen.getByText('High conversion potential - prioritize for immediate follow-up.')
    ).toBeInTheDocument();
  });

  it('handles AI analysis button click', async () => {
    enrichContactMock.mockResolvedValue({ enrichedData: { aiScore: 91, industry: 'Software' } });
    renderCard({}, { onAnalyze: vi.fn() });

    fireEvent.click(screen.getByTitle('Re-analyze with AI'));

    await waitFor(() => {
      expect(updateContactMock).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ aiScore: 91, industry: 'Software' })
      );
    });
    expect(enrichContactMock).toHaveBeenCalledWith(
      expect.objectContaining({ contactId: '1', data: expect.objectContaining({ name: 'John Doe' }) })
    );
  });

  it('shows the contact source', () => {
    renderCard();

    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('handles selection state', () => {
    const onSelect = vi.fn();
    renderCard({}, { isSelected: true, onSelect });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when the card is clicked', () => {
    const onClick = vi.fn();
    renderCard({}, { onClick });

    fireEvent.click(screen.getByText('John Doe'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows interest level with correct color', () => {
    const { container } = renderCard();

    expect(screen.getByText('Hot Client')).toBeInTheDocument();
    expect(container.querySelector('.bg-red-500.animate-pulse')).toBeInTheDocument();
  });

  it('displays AI score explanation on hover', async () => {
    renderCard();

    fireEvent.mouseEnter(screen.getByText('85'));

    await waitFor(
      () => {
        expect(
          screen.getByText(
            'High conversion potential based on engagement patterns, company size, and expressed interest level.'
          )
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles social research functionality', async () => {
    researchMock.mockResolvedValue({
      socialProfiles: { twitter: '@johndoe' },
      insights: 'Active on social media',
    });
    renderCard();

    fireEvent.click(screen.getByTitle('Social Media Research'));

    await waitFor(() => {
      expect(researchMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', name: 'John Doe' }),
        ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub'],
        'comprehensive'
      );
    });
  });
});

describe('Contact Scoring System', () => {
  it('calculates score color correctly', () => {
    const { rerender } = renderCard({ aiScore: 85 });

    // High score (green)
    expect(screen.getByText('85').closest('div')).toHaveClass('bg-green-500');

    const rerenderWith = (aiScore: number) =>
      rerender(
        <AIEnhancedContactCard
          contact={{ ...mockContact, aiScore }}
          isSelected={false}
          onSelect={() => {}}
          onClick={() => {}}
        />
      );

    // Medium score (blue)
    rerenderWith(65);
    expect(screen.getByText('65').closest('div')).toHaveClass('bg-blue-500');

    // Low-medium score (yellow)
    rerenderWith(45);
    expect(screen.getByText('45').closest('div')).toHaveClass('bg-yellow-500');

    // Low score (red)
    rerenderWith(35);
    expect(screen.getByText('35').closest('div')).toHaveClass('bg-red-500');
  });
});
