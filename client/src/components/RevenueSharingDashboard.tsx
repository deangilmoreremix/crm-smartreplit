import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, DollarSign, TrendingUp, Calendar, Settings, Plus, Eye, Edit, Award, Upload, X, FileText, AlertCircle, CheckCircle, Save, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PartnerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  customerGrowthRate: number;
}

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  tier: string;
  commissionRate: string;
  totalRevenue: string;
  totalCommissions: string;
  customerCount: number;
}

interface RevenueAnalytics {
  totalRevenue: number;
  totalCommissions: number;
  totalPartners: number;
  activePartners: number;
  totalCustomers: number;
  averageCommissionRate: number;
  monthlyGrowth: number;
  topPerformingTier: string;
  metrics: {
    revenue: {
      current: number;
      previousMonth: number;
      growth: number;
    };
    commissions: {
      current: number;
      previousMonth: number;
      growth: number;
    };
    partners: {
      current: number;
      previousMonth: number;
      growth: number;
    };
  };
}

export default function RevenueSharingDashboard() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced with database connectivity - fetching real data from Supabase
  const { data: analytics, isLoading: analyticsLoading } = useQuery<RevenueAnalytics>({
    queryKey: ['/api/revenue/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/revenue/analytics', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
    queryFn: async () => {
      const response = await fetch('/api/partners', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    website: '',
    businessType: '',
    tier: 'bronze',
    commissionRate: '15',
    contractTerms: '',
    notes: ''
  });

  const createNewPartner = async (formData: any) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateFormData({
          companyName: '',
          contactName: '',
          contactEmail: '',
          phone: '',
          website: '',
          businessType: '',
          tier: 'bronze',
          commissionRate: '15',
          contractTerms: '',
          notes: ''
        });
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      alert('Failed to create partner');
    }
  };

  // Sample chart data - Enhanced with more realistic data
  const revenueData = [
    { month: 'Jan', revenue: 42000, commissions: 8400, customers: 28 },
    { month: 'Feb', revenue: 48000, commissions: 9600, customers: 32 },
    { month: 'Mar', revenue: 52000, commissions: 10400, customers: 35 },
    { month: 'Apr', revenue: 58000, commissions: 11600, customers: 41 },
    { month: 'May', revenue: 65000, commissions: 13000, customers: 48 },
    { month: 'Jun', revenue: 72000, commissions: 14400, customers: 52 },
  ];

  const tierDistribution = [
    { name: 'Bronze', value: 40, color: '#CD7F32' },
    { name: 'Silver', value: 35, color: '#C0C0C0' },
    { name: 'Gold', value: 20, color: '#FFD700' },
    { name: 'Platinum', value: 5, color: '#E5E4E2' },
  ];

  if (analyticsLoading || partnersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading partner data...</p>
        </div>
      </div>
    );
  }

  // Use real data from database if available, fallback to sample data for demonstration
  const currentAnalytics = analytics || {
    totalRevenue: 485000,
    totalCommissions: 97000,
    totalPartners: 24,
    activePartners: 22,
    totalCustomers: 156,
    averageCommissionRate: 0.20,
    monthlyGrowth: 0.12,
    topPerformingTier: 'gold',
    metrics: {
      revenue: { current: 485000, previousMonth: 445000, growth: 0.09 },
      commissions: { current: 97000, previousMonth: 89000, growth: 0.09 },
      partners: { current: 24, previousMonth: 23, growth: 0.04 }
    }
  };

  const currentPartners = partners || [];

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* Header - Matching original design pattern */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Revenue Sharing Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage partner network and track revenue performance
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleTheme}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                data-testid="button-theme-toggle"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Light' : 'Dark'}
              </button>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                data-testid="button-bulk-import"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                data-testid="button-add-partner"
              >
                <Plus className="h-4 w-4" />
                Add Partner
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Navigation Tabs - Matching original pattern */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart },
              { id: 'partners', label: 'Partners', icon: Users },
              { id: 'commissions', label: 'Commissions', icon: DollarSign },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards - Following original design pattern */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${currentAnalytics.totalRevenue?.toLocaleString() || '485,000'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Commissions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${currentAnalytics.totalCommissions?.toLocaleString() || '97,000'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Active Partners
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentAnalytics.activePartners || 22}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Growth Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      +{((currentAnalytics.monthlyGrowth || 0.12) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue & Customer Growth */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Revenue & Customer Growth
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Partner Tier Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Partner Tier Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Partner List
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentPartners.length > 0 ? currentPartners.map((partner) => (
                      <tr key={partner.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {partner.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            partner.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                            partner.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                            partner.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {partner.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {partner.commissionRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            partner.status === 'active' ? 'bg-green-100 text-green-800' :
                            partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {partner.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${parseFloat(partner.totalRevenue).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-300">
                          No partners found. Create your first partner to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Commission Analytics
              </h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="commissions" fill="#10B981" name="Commissions Paid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Customer Activity Trends
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  <Bar dataKey="commissions" fill="#10B981" name="Commissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Partner Creation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Create New Partner
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Add a new revenue sharing partner to expand your network and grow your business together.
            </p>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={createFormData.companyName}
                  onChange={(e) => setCreateFormData({...createFormData, companyName: e.target.value})}
                  placeholder="Acme Corporation"
                  data-testid="input-company-name"
                />
              </div>
              
              <div>
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={createFormData.contactName}
                  onChange={(e) => setCreateFormData({...createFormData, contactName: e.target.value})}
                  placeholder="John Smith"
                  data-testid="input-contact-name"
                />
              </div>
              
              <div>
                <Label htmlFor="contactEmail">Email Address *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={createFormData.contactEmail}
                  onChange={(e) => setCreateFormData({...createFormData, contactEmail: e.target.value})}
                  placeholder="john@acme.com"
                  data-testid="input-contact-email"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={createFormData.website}
                  onChange={(e) => setCreateFormData({...createFormData, website: e.target.value})}
                  placeholder="https://acme.com"
                  data-testid="input-website"
                />
              </div>
              
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={createFormData.businessType} onValueChange={(value) => setCreateFormData({...createFormData, businessType: value})}>
                  <SelectTrigger data-testid="select-business-type">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="marketing">Marketing Agency</SelectItem>
                    <SelectItem value="sales">Sales Organization</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tier">Partner Tier</Label>
                <Select value={createFormData.tier} onValueChange={(value) => setCreateFormData({...createFormData, tier: value})}>
                  <SelectTrigger data-testid="select-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze (15%)</SelectItem>
                    <SelectItem value="silver">Silver (20%)</SelectItem>
                    <SelectItem value="gold">Gold (25%)</SelectItem>
                    <SelectItem value="platinum">Platinum (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  value={createFormData.commissionRate}
                  onChange={(e) => setCreateFormData({...createFormData, commissionRate: e.target.value})}
                  placeholder="15"
                  min="0"
                  max="100"
                  data-testid="input-commission-rate"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information</h3>
            
            <div>
              <Label htmlFor="contractTerms" className="text-gray-700 dark:text-gray-300">Contract Terms</Label>
              <Textarea
                id="contractTerms"
                value={createFormData.contractTerms}
                onChange={(e) => setCreateFormData({...createFormData, contractTerms: e.target.value})}
                placeholder="Additional contract terms and conditions..."
                rows={3}
                data-testid="textarea-contract-terms"
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Internal Notes</Label>
              <Textarea
                id="notes"
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({...createFormData, notes: e.target.value})}
                placeholder="Internal notes about this partner..."
                rows={2}
                data-testid="textarea-notes"
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} data-testid="button-cancel" className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              onClick={() => createNewPartner(createFormData)}
              disabled={!createFormData.companyName || !createFormData.contactName || !createFormData.contactEmail}
              data-testid="button-create-partner"
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={showBulkImportModal} onOpenChange={setShowBulkImportModal}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Bulk Import Partners
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Import multiple partners at once using a CSV file to quickly expand your network.
            </p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload a CSV file with partner information
              </p>
              <Button variant="outline" data-testid="button-choose-file">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    CSV Format Requirements
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                    Your CSV file should include these columns:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• companyName (required)</li>
                    <li>• contactName (required)</li>
                    <li>• contactEmail (required)</li>
                    <li>• phone (optional)</li>
                    <li>• website (optional)</li>
                    <li>• businessType (optional)</li>
                    <li>• tier (bronze, silver, gold, platinum)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" data-testid="button-download-template" className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBulkImportModal(false)} data-testid="button-cancel-import" className="min-w-[100px]">
                  Cancel
                </Button>
                <Button disabled data-testid="button-import-partners" className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Import Partners
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}