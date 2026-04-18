import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIEnhancedContactCard } from '../components/contacts/AIEnhancedContactCard';
import { Contact } from '../types';

// Mock the stores and services
vi.mock('../store/contactStore', () => ({
  useContactStore: () => ({
    updateContact: vi.fn(),
  }),
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
    researchContactSocialMedia: vi.fn(),
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

vi.mock('../components/GeminiImageModal', () => ({
  default: () => <div>Gemini Modal</div>,
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

describe('AIEnhancedContactCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contact information correctly', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('Example Corp')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays AI score with correct color', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    // AI score should be displayed (85 is high score, should be green)
    const scoreElement = screen.getByText('85');
    expect(scoreElement).toBeInTheDocument();
    expect(scoreElement.closest('div')).toHaveClass('bg-green-500');
  });

  it('shows enrichment data when available', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('handles AI analysis button click', async () => {
    const mockUpdateContact = vi.fn();
    vi.mocked(vi.importMock('../store/contactStore')).useContactStore.mockReturnValue({
      updateContact: mockUpdateContact,
    });

    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalled();
    });
  });

  it('displays custom fields', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('$100k')).toBeInTheDocument();
    expect(screen.getByText('3 months')).toBeInTheDocument();
  });

  it('shows activity indicators', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    // Should show last activity date
    expect(screen.getByText(/Jan 20, 2024/)).toBeInTheDocument();
  });

  it('handles selection state', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={true}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    // Should show selection indicator
    const card = screen.getByRole('button').closest('div');
    expect(card).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('displays tags correctly', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows interest level with correct color', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    const interestIndicator = screen.getByText('Hot Client');
    expect(interestIndicator).toBeInTheDocument();
    expect(interestIndicator.closest('div')).toHaveClass('bg-red-500');
  });

  it('displays AI score rationale when available', async () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    // Hover over score to show rationale
    const scoreElement = screen.getByText('85');
    fireEvent.mouseEnter(scoreElement);

    await waitFor(() => {
      expect(
        screen.getByText('High engagement, large company, decision maker')
      ).toBeInTheDocument();
    });
  });

  it('handles social research functionality', async () => {
    const mockResearch = vi.fn().mockResolvedValue({
      socialProfiles: { twitter: '@johndoe' },
      insights: 'Active on social media',
    });

    vi.mocked(
      vi.importMock('../services/gpt5SocialResearchService')
    ).gpt5SocialResearchService.researchContactSocialMedia.mockResolvedValue(mockResearch());

    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    const socialButton = screen.getByRole('button', { name: /social research/i });
    fireEvent.click(socialButton);

    await waitFor(() => {
      expect(mockResearch).toHaveBeenCalledWith(mockContact);
    });
  });
});

describe('Contact Scoring System', () => {
  it('calculates score color correctly', () => {
    const highScoreContact = { ...mockContact, aiScore: 85 };
    const mediumScoreContact = { ...mockContact, aiScore: 65 };
    const lowScoreContact = { ...mockContact, aiScore: 35 };

    // Test high score (green)
    const { rerender } = render(
      <AIEnhancedContactCard
        contact={highScoreContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    let scoreElement = screen.getByText('85');
    expect(scoreElement.closest('div')).toHaveClass('bg-green-500');

    // Test medium score (blue)
    rerender(
      <AIEnhancedContactCard
        contact={mediumScoreContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    scoreElement = screen.getByText('65');
    expect(scoreElement.closest('div')).toHaveClass('bg-blue-500');

    // Test low score (red)
    rerender(
      <AIEnhancedContactCard
        contact={lowScoreContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    scoreElement = screen.getByText('35');
    expect(scoreElement.closest('div')).toHaveClass('bg-red-500');
  });
});

describe('Contact Enrichment Features', () => {
  it('displays last enrichment timestamp', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    expect(screen.getByText(/Enriched.*Jan 20, 2024/)).toBeInTheDocument();
  });

  it('shows enrichment source', () => {
    render(
      <AIEnhancedContactCard
        contact={mockContact}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });
});
