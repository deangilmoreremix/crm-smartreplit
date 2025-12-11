import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import CommunicationDashboard from '../components/CommunicationDashboard';
import GlassCard from '../components/GlassCard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  DollarSign,
  FileText,
  Send,
  Download,
  Eye,
  Plus,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Calendar,
  Users,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdDate: string;
  items: InvoiceItem[];
  gpt5Optimization?: {
    suggestedAmount: number;
    confidence: number;
    reasoning: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface BillingStats {
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  collectionRate: number;
  monthlyGrowth: number;
}

export default function InvoicingDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('invoices');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedAmount, setOptimizedAmount] = useState<number | null>(null);
  const [clientIndustry, setClientIndustry] = useState('technology');
  const [daysOverdue, setDaysOverdue] = useState('30');
  const [currency, setCurrency] = useState('usd');
  const [paymentTerms, setPaymentTerms] = useState('net30');
  const [autoReminders, setAutoReminders] = useState('enabled');
  const [lateFeePolicy, setLateFeePolicy] = useState('percentage');

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<BillingStats>({
    queryKey: ['/api/invoices/stats'],
    refetchInterval: 30000,
  });

  const optimizeInvoiceAmount = async (baseAmount: number, clientInfo: any) => {
    setIsOptimizing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Base amount: $${baseAmount}, Client: ${JSON.stringify(clientInfo)}`,
        'pricing-optimization'
      );
      // Parse the result to extract suggested amount from optimizedContent
      const suggestedMatch = result.optimizedContent.match(/\$?(\d+(?:\.\d{2})?)/);
      if (suggestedMatch) {
        setOptimizedAmount(parseFloat(suggestedMatch[1]));
      }
    } catch (error) {
      console.error('Failed to optimize invoice amount:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="create-invoice"
      onClick={() => setShowCreateModal(true)}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Invoice
    </Button>,
    <Button
      key="ai-optimize"
      variant="outline"
      onClick={() => optimizeInvoiceAmount(2000, { industry: 'technology', size: 'enterprise' })}
      disabled={isOptimizing}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isOptimizing ? 'Optimizing...' : 'AI Price Optimizer'}
    </Button>
  ];

  const headerStats = stats ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Paid Invoices</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
      </div>
    </div>
  ) : null;

  return (
    <CommunicationDashboard
      appName="Smart Billing Intelligence"
      appDescription="AI-powered invoicing with automated pricing optimization, payment tracking, and intelligent collection management"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Invoice List */}
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <GlassCard
                    key={invoice.id}
                    className="p-4 cursor-pointer hover:border-blue-300"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100' :
                          invoice.status === 'sent' ? 'bg-blue-100' :
                          invoice.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{invoice.clientName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                        </div>
                        {invoice.gpt5Optimization && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-purple-600">AI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-semibold">${stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Invoice Value</span>
                    <span className="font-semibold">${stats.averageInvoiceValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Collection Rate</span>
                    <span className="font-semibold">{Math.round(stats.collectionRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth</span>
                    <span className="font-semibold text-green-600">+{Math.round(stats.monthlyGrowth * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Payment Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Paid This Month</span>
                    <span className="font-semibold text-green-600">{stats.paidInvoices}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Payment</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingInvoices}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overdue</span>
                    <span className="font-semibold text-red-600">{stats.overdueInvoices}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Payment Time</span>
                    <span className="font-semibold">12 days</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Price Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="base-amount">Base Amount</Label>
                    <Input
                      id="base-amount"
                      type="number"
                      placeholder="Enter base amount"
                      defaultValue="2000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-industry">Client Industry</Label>
                    <Select value={clientIndustry} onValueChange={setClientIndustry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => optimizeInvoiceAmount(2000, { industry: 'technology' })}
                    disabled={isOptimizing}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isOptimizing ? 'Optimizing...' : 'Optimize Price'}
                  </Button>
                  {optimizedAmount && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-green-800 dark:text-green-200">
                        Suggested Amount: <span className="font-bold">${optimizedAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Collection Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="overdue-amount">Overdue Amount</Label>
                    <Input
                      id="overdue-amount"
                      type="number"
                      placeholder="Enter overdue amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="days-overdue">Days Overdue</Label>
                    <Select value={daysOverdue} onValueChange={setDaysOverdue}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="15">15 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90+ days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Generate Collection Strategy
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-blue-50">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">Professional</h3>
                    <p className="text-sm text-gray-600">Clean, corporate design</p>
                  </div>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-green-50">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">Modern</h3>
                    <p className="text-sm text-gray-600">Contemporary styling</p>
                  </div>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-purple-50">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium">Creative</h3>
                    <p className="text-sm text-gray-600">Bold, artistic design</p>
                  </div>
                </GlassCard>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Invoicing Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="cad">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-reminders</Label>
                  <Select value={autoReminders} onValueChange={setAutoReminders}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Late Fee Policy</Label>
                  <Select value={lateFeePolicy} onValueChange={setLateFeePolicy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">1.5% per month</SelectItem>
                      <SelectItem value="fixed">$25 per month</SelectItem>
                      <SelectItem value="none">No late fees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Invoice Number</Label>
                  <div className="font-medium">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Client</Label>
                  <div className="font-medium">{selectedInvoice.clientName}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</Label>
                  <div className="font-medium">${selectedInvoice.amount.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Items</Label>
                <div className="space-y-2">
                  {selectedInvoice.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">{item.description}</span>
                      <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInvoice.gpt5Optimization && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Price Optimization
                  </Label>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                      Suggested Amount: <span className="font-bold">${selectedInvoice.gpt5Optimization.suggestedAmount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Confidence: {Math.round(selectedInvoice.gpt5Optimization.confidence * 100)}%
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      {selectedInvoice.gpt5Optimization.reasoning}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CommunicationDashboard>
  );
}