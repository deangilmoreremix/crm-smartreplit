
/**
 * Social Media Research UI Component
 * Complete standalone component for GPT-5 social media research
 */

class SocialMediaResearchComponent {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.apiKey = options.apiKey;
    this.socialService = new GPT5SocialResearchService(this.apiKey, options);
    this.currentContact = null;
    this.researchResults = null;
    
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="social-media-research">
        <style>
          .social-media-research {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .research-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          
          .research-form {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
          }
          
          .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
          }
          
          .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #667eea;
          }
          
          .platform-selector {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
          }
          
          .platform-checkbox {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: #f9fafb;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .platform-checkbox:hover {
            background: #f3f4f6;
          }
          
          .platform-checkbox input {
            margin-right: 8px;
            width: auto;
          }
          
          .research-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s;
          }
          
          .research-button:hover {
            transform: translateY(-2px);
          }
          
          .research-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .results-container {
            display: none;
          }
          
          .results-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .results-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .results-card h3 {
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .profile-item {
            display: flex;
            align-items: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            margin-bottom: 10px;
          }
          
          .profile-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            margin-right: 15px;
          }
          
          .profile-info h4 {
            margin: 0 0 5px 0;
            color: #1f2937;
          }
          
          .profile-info p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          
          .confidence-score {
            margin-left: auto;
            padding: 4px 8px;
            background: #10b981;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          
          .insight-item {
            padding: 12px;
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            margin-bottom: 10px;
            border-radius: 0 6px 6px 0;
          }
          
          .insight-item strong {
            color: #0c4a6e;
          }
          
          .recommendations-list {
            list-style: none;
            padding: 0;
          }
          
          .recommendations-list li {
            padding: 10px 15px;
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            margin-bottom: 8px;
            border-radius: 0 6px 6px 0;
          }
          
          .monitoring-setup {
            background: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
          }
          
          .monitoring-button {
            background: #22c55e;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          }
          
          @media (max-width: 768px) {
            .results-grid {
              grid-template-columns: 1fr;
            }
            
            .platform-selector {
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
          }
        </style>
        
        <div class="research-header">
          <h1>🔍 GPT-5 Social Media Research</h1>
          <p>Advanced AI-powered social media profile discovery and analysis</p>
        </div>
        
        <div class="research-form">
          <h2>Contact Information</h2>
          
          <div class="form-group">
            <label for="contact-name">Full Name *</label>
            <input type="text" id="contact-name" placeholder="John Smith" required>
          </div>
          
          <div class="form-group">
            <label for="contact-email">Email Address</label>
            <input type="email" id="contact-email" placeholder="john@company.com">
          </div>
          
          <div class="form-group">
            <label for="contact-company">Company</label>
            <input type="text" id="contact-company" placeholder="Tech Corp Inc">
          </div>
          
          <div class="form-group">
            <label for="contact-title">Job Title</label>
            <input type="text" id="contact-title" placeholder="Senior Director">
          </div>
          
          <div class="form-group">
            <label for="research-depth">Research Depth</label>
            <select id="research-depth">
              <option value="basic">Basic - Quick profile discovery</option>
              <option value="comprehensive" selected>Comprehensive - Detailed analysis</option>
              <option value="deep">Deep - Maximum insights</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Platforms to Research</label>
            <div class="platform-selector" id="platform-selector">
              <!-- Platforms will be populated by JavaScript -->
            </div>
          </div>
          
          <button class="research-button" id="start-research">
            Start Research
          </button>
        </div>
        
        <div class="results-container" id="results-container">
          <div class="results-grid">
            <div class="results-card">
              <h3>📱 Social Profiles Found</h3>
              <div id="profiles-list"></div>
            </div>
            
            <div class="results-card">
              <h3>🧠 Personality Insights</h3>
              <div id="personality-insights"></div>
            </div>
            
            <div class="results-card">
              <h3>📊 Engagement Metrics</h3>
              <div id="engagement-metrics"></div>
            </div>
            
            <div class="results-card">
              <h3>💡 Recommendations</h3>
              <div id="recommendations"></div>
            </div>
          </div>
          
          <div class="monitoring-setup">
            <h3>🔔 Set up Social Monitoring</h3>
            <p>Get notified when this contact updates their social media profiles, changes jobs, or posts relevant content.</p>
            <button class="monitoring-button" id="setup-monitoring">
              Enable Smart Monitoring
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.populatePlatformSelector();
  }

  populatePlatformSelector() {
    const platformSelector = document.getElementById('platform-selector');
    const platforms = this.socialService.supportedPlatforms;
    
    platforms.forEach(platform => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'platform-checkbox';
      checkboxDiv.innerHTML = `
        <input type="checkbox" id="platform-${platform}" value="${platform}" checked>
        <label for="platform-${platform}">${platform}</label>
      `;
      platformSelector.appendChild(checkboxDiv);
    });
  }

  attachEventListeners() {
    const startButton = document.getElementById('start-research');
    const monitoringButton = document.getElementById('setup-monitoring');
    
    startButton.addEventListener('click', () => this.startResearch());
    monitoringButton.addEventListener('click', () => this.setupMonitoring());
  }

  async startResearch() {
    const button = document.getElementById('start-research');
    const originalText = button.textContent;
    
    // Get form data
    const contact = {
      id: Date.now().toString(),
      name: document.getElementById('contact-name').value,
      email: document.getElementById('contact-email').value,
      company: document.getElementById('contact-company').value,
      title: document.getElementById('contact-title').value
    };
    
    if (!contact.name) {
      alert('Please enter a contact name');
      return;
    }
    
    const depth = document.getElementById('research-depth').value;
    const selectedPlatforms = Array.from(document.querySelectorAll('#platform-selector input:checked'))
      .map(input => input.value);
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>Researching...';
    
    try {
      this.currentContact = contact;
      this.researchResults = await this.socialService.researchContactSocialMedia(
        contact, 
        selectedPlatforms, 
        depth
      );
      
      this.displayResults();
      
    } catch (error) {
      console.error('Research failed:', error);
      alert('Research failed. Please try again.');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  displayResults() {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'block';
    
    // Display profiles
    this.displayProfiles();
    this.displayPersonalityInsights();
    this.displayEngagementMetrics();
    this.displayRecommendations();
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  displayProfiles() {
    const profilesList = document.getElementById('profiles-list');
    const profiles = this.researchResults.profiles;
    
    if (profiles.length === 0) {
      profilesList.innerHTML = '<p>No social profiles found.</p>';
      return;
    }
    
    profilesList.innerHTML = profiles.map(profile => `
      <div class="profile-item">
        <div class="profile-icon">${profile.platform.charAt(0)}</div>
        <div class="profile-info">
          <h4>${profile.platform}</h4>
          <p>@${profile.username}</p>
          <p>${profile.followers ? `${profile.followers.toLocaleString()} followers` : 'Followers unknown'}</p>
        </div>
        <div class="confidence-score">${profile.confidence}%</div>
      </div>
    `).join('');
  }

  displayPersonalityInsights() {
    const insightsDiv = document.getElementById('personality-insights');
    const insights = this.researchResults.personalityInsights;
    
    let html = '';
    
    if (insights.traits) {
      Object.entries(insights.traits).forEach(([key, value]) => {
        html += `
          <div class="insight-item">
            <strong>${key}:</strong> ${value}
          </div>
        `;
      });
    }
    
    if (insights.communicationStyle) {
      html += `
        <div class="insight-item">
          <strong>Communication Style:</strong> ${insights.communicationStyle}
        </div>
      `;
    }
    
    insightsDiv.innerHTML = html || '<p>No personality insights available.</p>';
  }

  displayEngagementMetrics() {
    const metricsDiv = document.getElementById('engagement-metrics');
    const metrics = this.researchResults.engagementMetrics;
    
    let html = '';
    
    if (metrics.averageEngagement) {
      html += `
        <div class="insight-item">
          <strong>Average Engagement:</strong> ${metrics.averageEngagement}%
        </div>
      `;
    }
    
    if (metrics.bestPostingTimes) {
      html += `
        <div class="insight-item">
          <strong>Best Posting Times:</strong> ${metrics.bestPostingTimes.join(', ')}
        </div>
      `;
    }
    
    if (metrics.preferredContentTypes) {
      html += `
        <div class="insight-item">
          <strong>Preferred Content:</strong> ${metrics.preferredContentTypes.join(', ')}
        </div>
      `;
    }
    
    metricsDiv.innerHTML = html || '<p>No engagement metrics available.</p>';
  }

  displayRecommendations() {
    const recommendationsDiv = document.getElementById('recommendations');
    const recommendations = this.researchResults.monitoringRecommendations;
    
    if (recommendations.length === 0) {
      recommendationsDiv.innerHTML = '<p>No specific recommendations available.</p>';
      return;
    }
    
    const html = `
      <ul class="recommendations-list">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    `;
    
    recommendationsDiv.innerHTML = html;
  }

  async setupMonitoring() {
    if (!this.currentContact) {
      alert('Please complete a research first');
      return;
    }
    
    const button = document.getElementById('setup-monitoring');
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = 'Setting up...';
    
    try {
      const platforms = this.researchResults.profiles.map(p => p.platform);
      const alertTypes = ['job_change', 'new_content', 'engagement_spike'];
      
      const result = await this.socialService.setupSocialMonitoring(
        this.currentContact.id,
        platforms,
        alertTypes
      );
      
      if (result.success) {
        alert(`Monitoring setup successful! Monitoring ID: ${result.monitoringId}`);
        button.textContent = '✅ Monitoring Active';
        button.style.background = '#10b981';
      }
      
    } catch (error) {
      console.error('Monitoring setup failed:', error);
      alert('Failed to set up monitoring. Please try again.');
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  // Public method to get research results
  getResults() {
    return this.researchResults;
  }

  // Public method to research a contact programmatically
  async researchContact(contact, options = {}) {
    this.currentContact = contact;
    this.researchResults = await this.socialService.researchContactSocialMedia(
      contact,
      options.platforms || [],
      options.depth || 'comprehensive'
    );
    return this.researchResults;
  }
}

// Export for use in other applications
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialMediaResearchComponent;
}

// Browser global export
if (typeof window !== 'undefined') {
  window.SocialMediaResearchComponent = SocialMediaResearchComponent;
}
