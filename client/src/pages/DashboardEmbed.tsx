import React from 'react';
import EmbeddableDashboard from '../components/EmbeddableDashboard';
import '../styles/dashboard-embed.css';

const DashboardEmbed: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="embed-container">
          <div className="embed-header">
            <h1>Smart CRM Dashboard</h1>
            <p>Real-time insights into your business performance</p>
            <div className="feature-badges">
              <div className="feature-badge">🔄 Auto-refreshing</div>
              <div className="feature-badge">📊 Real-time data</div>
              <div className="feature-badge">🎯 AI-powered insights</div>
            </div>
          </div>

          <div className="embed-content">
            <EmbeddableDashboard />
          </div>

          <div className="embed-actions">
            <p>Experience the full power of our CRM platform</p>
            <div className="action-buttons">
              <a href="/auth/login" className="btn-primary">
                Get Started Free
              </a>
              <a href="/dashboard" className="btn-secondary">
                View Full Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEmbed;