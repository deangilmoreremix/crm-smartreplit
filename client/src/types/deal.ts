export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: DealStage;
  probability: number;
  contactId: string;
  companyId?: string;
  assignedUserId?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  daysInStage?: number;
  source: 'website' | 'referral' | 'cold-call' | 'email' | 'social' | 'event' | 'other';
  tags: string[];
  customFields: Record<string, any>;
  activities: DealActivity[];
  attachments: DealAttachment[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  lostReason?: string;
  nextFollowUp?: Date;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  currency: string;
  exchangeRate?: number;
  commission?: number;
  discount?: number;
  dealProducts?: DealProduct[];
}

export interface DealStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
  isActive: boolean;
  automated?: boolean;
  duration?: number; // days
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'proposal_sent' | 'contract_signed';
  title: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface DealAttachment {
  id: string;
  dealId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface DealProduct {
  id: string;
  dealId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: DealStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesMetrics {
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
  averageDealSize: number;
  averageSalesCycle: number; // days
  conversionRate: number; // percentage
  winRate: number; // percentage
  salesVelocity: number; // value per day
  forecastedRevenue: number;
}

export interface DealForecast {
  month: string;
  forecasted: number;
  committed: number;
  bestCase: number;
  pipeline: number;
  closed: number;
}

export interface SalesTarget {
  id: string;
  userId?: string;
  teamId?: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  targetValue: number;
  actualValue: number;
  startDate: Date;
  endDate: Date;
  currency: string;
}

export interface DealFilter {
  stages?: string[];
  assignedUsers?: string[];
  priorities?: string[];
  sources?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  searchTerm?: string;
}

export interface DealSortOption {
  field: keyof Deal;
  direction: 'asc' | 'desc';
}
