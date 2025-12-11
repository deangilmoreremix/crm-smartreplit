import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  TrendingUp,
  Target,
  Building2,
  BarChart3,
  Settings,
  Brain,
  Zap,
  CheckCircle,
  Activity,
  Search,
  Database,
  Download,
  Upload,
  Shield,
  FileText,
} from 'lucide-react';

export default function AdvancedFeaturesDashboard() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const advancedFeatures = [
    {
      id: 'advanced_search',
      name: 'Advanced Search & Filtering',
      description: 'Powerful search with AI-powered suggestions and complex filters',
      icon: Search,
      status: 'active',
      usage: 85,
      category: 'Search & Discovery'
    },
    {
      id: 'bulk_operations',
      name: 'Bulk Operations',
      description: 'Mass update, delete, and modify records with intelligent validation',
      icon: Database,
      status: 'active',
      usage: 67,
      category: 'Data Management'
    },
    {
      id: 'data_export',
      name: 'Advanced Data Export',
      description: 'Export data in multiple formats with custom templates',
      icon: Download,
      status: 'active',
      usage: 92,
      category: 'Data Management'
    },
    {
      id: 'data_import',
      name: 'Smart Data Import',
      description: 'AI-powered data import with duplicate detection and field mapping',
      icon: Upload,
      status: 'active',
      usage: 73,
      category: 'Data Management'
    },
    {
      id: 'workflow_automation',
      name: 'Workflow Automation',
      description: 'Complex business process automation with conditional logic',
      icon: Zap,
      status: 'active',
      usage: 88,
      category: 'Automation'
    },
    {
      id: 'custom_fields',
      name: 'Custom Fields & Objects',
      description: 'Create custom data structures and field types',
      icon: Settings,
      status: 'active',
      usage: 56,
      category: 'Customization'
    },
    {
      id: 'advanced_permissions',
      name: 'Advanced Permissions',
      description: 'Granular role-based access control with field-level security',
      icon: Shield,
      status: 'active',
      usage: 94,
      category: 'Security'
    },
    {
      id: 'audit_trail',
      name: 'Audit Trail & Compliance',
      description: 'Complete activity logging and compliance reporting',
      icon: FileText,
      status: 'active',
      usage: 78,
      category: 'Compliance'
    }
  ];

  const performanceMetrics = {
    searchQueries: 15420,
    bulkOperations: 342,
    dataExports: 89,
    dataImports: 23,
    automationsExecuted: 1205,
    customFieldsCreated: 67,
    permissionChanges: 45,
    auditLogEntries: 8392
  };

  const securityFeatures = [
    {
      name: 'Data Encryption',
      status: 'enabled',
      description: 'AES-256 encryption for data at rest and in transit',
      level: 'enterprise'
    },
    {
      name: 'Multi-Factor Authentication',
      status: 'enabled',
      description: 'TOTP, SMS, and biometric authentication options',
      level: 'standard'
    },
    {
      name: 'Single Sign-On',
      status: 'enabled',
      description: 'SAML 2.0 and OAuth 2.0 integration',
      level: 'enterprise'
    },
    {
      name: 'IP Whitelist',
      status: 'configured',
      description: 'Restrict access from specific IP addresses',
      level: 'standard'
    },
    {
      name: 'Session Management',
      status: 'enabled',
      description: 'Automatic session timeout and concurrent session limits',
      level: 'standard'
    },
    {
      name: 'Data Loss Prevention',
      status: 'enabled',
      description: 'Monitor and prevent sensitive data exfiltration',
      level: 'enterprise'
    }
  ];

  const AdvancedSearchTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Search Capabilities</h4>
              <div className="space-y-2">
                {[
                  'Full-text search across all fields',
                  'Fuzzy matching for typos',
                  'Boolean operators (AND, OR, NOT)',
                  'Wildcard and regex patterns',
                  'Date range filtering',
                  'Numerical range queries',
                  'Location-based search',
                  'AI-powered suggestions'
                ].map((capability) => (
                  <div key={capability} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Search Performance</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Average Search Time</span>
                    <span>120ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Search Accuracy</span>
                    <span>94.7%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Index Size</span>
                    <span>2.4 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Searches & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'High-Value Prospects', usage: 234, shared: true },
              { name: 'Overdue Tasks', usage: 156, shared: false },
              { name: 'Recent Conversations', usage: 89, shared: true },
              { name: 'Enterprise Deals', usage: 67, shared: false },
              { name: 'Support Tickets', usage: 45, shared: true },
              { name: 'Marketing Qualified Leads', usage: 178, shared: false }
            ].map((search) => (
              <div key={search.name} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{search.name}</h4>
                  {search.shared && <Badge variant="outline" className="text-xs">Shared</Badge>}
                </div>
                <p className="text-xs text-gray-600">{search.usage} uses this month</p>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" className="text-xs h-6">Edit</Button>
                  <Button size="sm" variant="outline" className="text-xs h-6">Run</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const BulkOperationsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bulk Update</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Update multiple records simultaneously with validation
            </p>
            <Button className="w-full" size="sm">Start Bulk Update</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bulk Delete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Safely delete multiple records with dependency checking
            </p>
            <Button variant="outline" className="w-full" size="sm">Start Bulk Delete</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bulk Merge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Merge duplicate records with AI-powered suggestions
            </p>
            <Button variant="outline" className="w-full" size="sm">Start Bulk Merge</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                operation: 'Bulk Update', 
                records: 150, 
                status: 'completed', 
                time: '2 hours ago',
                user: 'John Smith'
              },
              { 
                operation: 'Bulk Delete', 
                records: 45, 
                status: 'completed', 
                time: '5 hours ago',
                user: 'Sarah Johnson'
              },
              { 
                operation: 'Bulk Merge', 
                records: 23, 
                status: 'in_progress', 
                time: '1 hour ago',
                user: 'Mike Wilson'
              },
              { 
                operation: 'Bulk Update', 
                records: 89, 
                status: 'failed', 
                time: '3 hours ago',
                user: 'Lisa Davis'
              }
            ].map((op, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{op.operation}</span>
                    <Badge variant={
                      op.status === 'completed' ? 'default' :
                      op.status === 'in_progress' ? 'secondary' :
                      'destructive'
                    }>
                      {op.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    {op.records} records • {op.user} • {op.time}
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SecurityComplianceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityFeatures.map((feature) => (
                <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{feature.name}</h4>
                      <Badge variant={feature.level === 'enterprise' ? 'default' : 'secondary'}>
                        {feature.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    feature.status === 'enabled' ? 'bg-green-500' :
                    feature.status === 'configured' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>System Performance</span>
                  <span>98.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Database Optimization</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cache Hit Rate</span>
                  <span>89.7%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89.7%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>67.3%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '67.3%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance & Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'GDPR Compliance', status: 'compliant', score: 98 },
              { name: 'SOC 2 Type II', status: 'certified', score: 96 },
              { name: 'ISO 27001', status: 'in_progress', score: 85 },
              { name: 'HIPAA', status: 'compliant', score: 94 }
            ].map((compliance) => (
              <div key={compliance.name} className="text-center p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{compliance.name}</h4>
                <div className={`text-2xl font-bold mb-1 ${
                  compliance.status === 'compliant' || compliance.status === 'certified' 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {compliance.score}%
                </div>
                <Badge variant={
                  compliance.status === 'compliant' || compliance.status === 'certified'
                    ? 'default' 
                    : 'secondary'
                }>
                  {compliance.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Features</h1>
            <p className="text-gray-600">Power user tools and enterprise capabilities</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {performanceMetrics.searchQueries.toLocaleString()} searches
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {performanceMetrics.automationsExecuted.toLocaleString()} automations
            </Badge>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {advancedFeatures.slice(0, 4).map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card key={feature.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base">{feature.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{feature.category}</Badge>
                    <span className="text-sm font-medium">{feature.usage}% usage</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Tabs */}
        <Tabs value="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Advanced Search
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Bulk Operations
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security & Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <AdvancedSearchTab />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkOperationsTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityComplianceTab />
          </TabsContent>
        </Tabs>

        {/* All Features Grid */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>All Advanced Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div 
                    key={feature.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                      selectedFeature === feature.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedFeature(
                      selectedFeature === feature.id ? null : feature.id
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{feature.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {feature.category}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              feature.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs">{feature.usage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
