import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useCommunicationStore } from '../store/communicationStore';
import EmailComposer from './EmailComposer';
import { 
  Mail, 
  Send, 
  Clock, 
  Eye, 
  Reply, 
  Search, 
  Filter,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { Email } from '../types/communication';

export default function EmailDashboard() {
  const {
    emails,
    templates,
    analytics,
    filter,
    getFilteredEmails,
    getDraftEmails,
    getSentEmails,
    getScheduledEmails,
    setFilter,
    clearFilters,
    markAsRead,
    deleteEmail
  } = useCommunicationStore();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');

  const filteredEmails = getFilteredEmails();
  const draftEmails = getDraftEmails();
  const sentEmails = getSentEmails();
  const scheduledEmails = getScheduledEmails();

  useEffect(() => {
    setFilter({ searchQuery });
  }, [searchQuery, setFilter]);

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (email.status !== 'read' && email.status !== 'replied') {
      markAsRead(email.id);
    }
  };

  const handleReply = (email: Email) => {
    setReplyToEmail(email);
    setIsComposerOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: Email['status']) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-500" />;
      case 'delivered': return <Mail className="w-4 h-4 text-green-500" />;
      case 'read': return <Eye className="w-4 h-4 text-purple-500" />;
      case 'replied': return <Reply className="w-4 h-4 text-indigo-500" />;
      case 'failed': return <Mail className="w-4 h-4 text-red-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Email['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const EmailList = ({ emails, title }: { emails: Email[]; title: string }) => (
    <div className="space-y-2">
      {emails.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No {title.toLowerCase()} found</p>
        </div>
      ) : (
        emails.map((email) => (
          <div
            key={email.id}
            className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-200' : ''
            } ${email.status === 'read' || email.status === 'replied' ? '' : 'font-medium'}`}
            onClick={() => handleEmailClick(email)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(email.status)}
                  <span className="text-sm text-gray-600">
                    {email.fromAddress}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={getPriorityColor(email.priority)}
                  >
                    {email.priority}
                  </Badge>
                  {email.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h3 className="font-medium text-gray-900 truncate">
                  {email.subject}
                </h3>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {email.content}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{formatDate(email.createdAt)}</span>
                  {email.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                      📎 {email.attachments.length}
                    </span>
                  )}
                  {email.trackingEnabled && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Tracked
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReply(email);
                  }}
                >
                  <Reply className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show more options
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email</h1>
            <p className="text-gray-600">Manage your email communications</p>
          </div>
          <Button onClick={() => setIsComposerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSent}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.deliveryRate > 0 && (
                  <span className="text-green-600">
                    {(analytics.deliveryRate * 100).toFixed(1)}% delivery rate
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.openRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalOpened} emails opened
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.clickRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalClicked} emails clicked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.replyRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalReplied} emails replied
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Emails</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="inbox">
                      Inbox ({filteredEmails.length})
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                      Sent ({sentEmails.length})
                    </TabsTrigger>
                    <TabsTrigger value="drafts">
                      Drafts ({draftEmails.length})
                    </TabsTrigger>
                    <TabsTrigger value="scheduled">
                      Scheduled ({scheduledEmails.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="inbox">
                    <EmailList emails={filteredEmails} title="Inbox" />
                  </TabsContent>

                  <TabsContent value="sent">
                    <EmailList emails={sentEmails} title="Sent" />
                  </TabsContent>

                  <TabsContent value="drafts">
                    <EmailList emails={draftEmails} title="Drafts" />
                  </TabsContent>

                  <TabsContent value="scheduled">
                    <EmailList emails={scheduledEmails} title="Scheduled" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Email Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEmail ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(selectedEmail.status)}
                        <Badge className={getPriorityColor(selectedEmail.priority)}>
                          {selectedEmail.priority}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-lg">
                        {selectedEmail.subject}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>From: {selectedEmail.fromAddress}</p>
                        <p>To: {selectedEmail.toAddresses.join(', ')}</p>
                        <p>Date: {formatDate(selectedEmail.createdAt)}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="prose prose-sm max-w-none">
                        {selectedEmail.htmlContent ? (
                          <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                        ) : (
                          <p className="whitespace-pre-wrap">{selectedEmail.content}</p>
                        )}
                      </div>
                    </div>

                    {selectedEmail.attachments.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedEmail.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 text-sm">
                              📎 {attachment.fileName}
                              <span className="text-gray-500">
                                ({(attachment.fileSize / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEmail.tags.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmail.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(selectedEmail)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm">
                        Forward
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteEmail(selectedEmail.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select an email to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Templates</span>
                  <span className="font-medium">{templates.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unread</span>
                  <span className="font-medium">
                    {emails.filter(e => e.status !== 'read' && e.status !== 'replied').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Today's Emails</span>
                  <span className="font-medium">
                    {emails.filter(e => {
                      const today = new Date();
                      const emailDate = new Date(e.createdAt);
                      return emailDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Composer */}
        <EmailComposer
          isOpen={isComposerOpen}
          onClose={() => {
            setIsComposerOpen(false);
            setReplyToEmail(null);
          }}
          replyToEmail={replyToEmail || undefined}
        />
      </div>
    </div>
  );
}
