import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Send,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

interface TaxDocument {
  id: string;
  partnerId: string;
  year: number;
  documentType: '1099-NEC' | '1099-MISC' | '1099-K';
  totalCompensation: number;
  totalCommissions: number;
  totalPayouts: number;
  taxesWithheld: number;
  netAmount: number;
  generatedAt: string;
  status: 'draft' | 'generated' | 'sent' | 'accepted';
}

interface TaxSummary {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  year: number;
  totalCompensation: number;
  taxYearIncome: number;
  withholding: number;
  netEarnings: number;
  documentCount: number;
}

export default function TaxDocumentsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading: documentsLoading } = useQuery<TaxDocument[]>({
    queryKey: ['/api/partners/tax-documents', selectedPartnerId],
    enabled: !!selectedPartnerId,
    refetchInterval: 30000,
  });

  const { data: summaries, isLoading: summariesLoading } = useQuery<TaxSummary[]>({
    queryKey: ['/api/partners/tax-summaries'],
    refetchInterval: 30000,
  });

  const generateMutation = useMutation({
    mutationFn: (data: { partnerId: string; year: number }) =>
      apiRequest('/api/partners/tax-documents/generate', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners/tax-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/partners/tax-summaries'] });
      toast({ title: 'Tax document generated successfully' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (documentId: string) =>
      apiRequest(`/api/partners/tax-documents/${documentId}/send`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners/tax-documents'] });
      toast({ title: 'Tax document marked as sent' });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      generated: 'bg-blue-100 text-blue-800',
      sent: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      '1099-NEC': 'bg-purple-100 text-purple-800',
      '1099-MISC': 'bg-orange-100 text-orange-800',
      '1099-K': 'bg-teal-100 text-teal-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Tax Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Generate and manage 1099 tax documents for partners
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-sm font-medium">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Tax Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summariesLoading ? '...' : summaries?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compensation</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaries?.reduce((sum, s) => sum + s.totalCompensation, 0) || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Generated</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summariesLoading ? '...' : summaries?.reduce((sum, s) => sum + s.documentCount, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedYear}</div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Tax Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Tax Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          {summariesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : summaries && summaries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Partner</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-right p-4">Compensation</th>
                    <th className="text-right p-4">Withholding</th>
                    <th className="text-right p-4">Net Earnings</th>
                    <th className="text-center p-4">Documents</th>
                    <th className="text-center p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => (
                    <tr key={summary.partnerId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4 font-medium">{summary.partnerName}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{summary.partnerEmail}</td>
                      <td className="text-right p-4 font-semibold">
                        {formatCurrency(summary.totalCompensation)}
                      </td>
                      <td className="text-right p-4">{formatCurrency(summary.withholding)}</td>
                      <td className="text-right p-4 font-semibold text-green-600">
                        {formatCurrency(summary.netEarnings)}
                      </td>
                      <td className="text-center p-4">
                        <Badge>{summary.documentCount}</Badge>
                      </td>
                      <td className="text-center p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPartnerId(summary.partnerId);
                            generateMutation.mutate({ partnerId: summary.partnerId, year: selectedYear });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Generate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tax Summaries</h3>
              <p className="text-gray-600">
                Partner tax summaries will appear here once data is available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Document Type</th>
                    <th className="text-left p-4">Year</th>
                    <th className="text-right p-4">Compensation</th>
                    <th className="text-right p-4">Net Amount</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-center p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <Badge className={getDocumentTypeBadge(doc.documentType)}>
                          {doc.documentType}
                        </Badge>
                      </td>
                      <td className="p-4">{doc.year}</td>
                      <td className="text-right p-4 font-semibold">
                        {formatCurrency(doc.totalCompensation)}
                      </td>
                      <td className="text-right p-4 font-semibold text-green-600">
                        {formatCurrency(doc.netAmount)}
                      </td>
                      <td className="text-center p-4">
                        <Badge className={getStatusBadge(doc.status)}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendMutation.mutate(doc.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tax Documents</h3>
              <p className="text-gray-600 mb-4">
                Generate tax documents for your partners to get started.
              </p>
              {selectedPartnerId ? (
                <Button
                  onClick={() =>
                    generateMutation.mutate({ partnerId: selectedPartnerId, year: selectedYear })
                  }
                  disabled={generateMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              ) : (
                <p className="text-sm text-gray-500">Select a partner from the summaries above</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
