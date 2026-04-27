import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Lock, Key, Users } from 'lucide-react';
import { SecurityAudit, SecurityReport } from '../utils/securityAudit';

interface SecuritySettingsProps {
  tenantId?: string;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ tenantId = 'default-tenant' }) => {
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuditDetails, setShowAuditDetails] = useState(false);

  useEffect(() => {
    loadSecurityReport();
  }, [tenantId]);

  const loadSecurityReport = async () => {
    try {
      setLoading(true);
      // In production, this would call the security API
      const report = SecurityAudit.auditTenantSecurity(tenantId);
      setSecurityReport(report);
    } catch (error) {
      console.error('Failed to load security report:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSecurityAudit = () => {
    loadSecurityReport();
    setShowAuditDetails(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security & Compliance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage tenant security settings
          </p>
        </div>
        <button
          onClick={runSecurityAudit}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Shield className="w-4 h-4 mr-2" />
          Run Security Audit
        </button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Risk</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {securityReport?.overallRisk || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical Issues
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {securityReport?.findings.filter((f) => f.severity === 'critical').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Lock className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {securityReport?.findings.filter((f) => f.status === 'resolved').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Audit</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {securityReport?.timestamp
                  ? new Date(securityReport.timestamp).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Findings */}
      {securityReport && showAuditDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Audit Findings
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detailed security assessment for tenant {tenantId}
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {securityReport.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getRiskIcon(finding.severity)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {finding.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {finding.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(finding.severity)}`}
                    >
                      {finding.severity}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3">{finding.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">Impact</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{finding.impact}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                        Remediation
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {finding.remediation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {securityReport?.recommendations && securityReport.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Recommendations
            </h3>
          </div>

          <div className="p-6">
            <ul className="space-y-3">
              {securityReport.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Security Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2 text-blue-600" />
            Authentication Policies
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Password Strength</span>
              <span className="text-sm font-medium text-green-600">Strong</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">2FA Required</span>
              <span className="text-sm font-medium text-yellow-600">Optional</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Session Timeout</span>
              <span className="text-sm font-medium text-green-600">8 hours</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            Access Control
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Role-Based Access</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Audit Logging</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Data Encryption</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
