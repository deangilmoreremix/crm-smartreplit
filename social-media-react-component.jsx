
import React, { useEffect, useRef, useState } from 'react';

const SocialMediaResearch = ({ 
  apiKey, 
  mockMode = true, 
  onResults = null,
  defaultContact = null 
}) => {
  const containerRef = useRef(null);
  const componentRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Wait for scripts to load
    const checkScriptsLoaded = () => {
      if (window.SocialMediaResearchComponent && window.GPT5SocialResearchService) {
        // Initialize the component
        componentRef.current = new window.SocialMediaResearchComponent(
          containerRef.current.id,
          {
            apiKey,
            mockMode,
            baseUrl: 'https://api.openai.com/v1'
          }
        );

        setIsLoaded(true);

        // Research default contact if provided
        if (defaultContact) {
          componentRef.current.researchContact(defaultContact).then(results => {
            if (onResults) {
              onResults(results);
            }
          });
        }
      } else {
        setTimeout(checkScriptsLoaded, 100);
      }
    };

    checkScriptsLoaded();

    return () => {
      // Cleanup if needed
      if (componentRef.current) {
        componentRef.current = null;
      }
    };
  }, [apiKey, mockMode, defaultContact, onResults]);

  const researchContact = async (contact, options = {}) => {
    if (componentRef.current) {
      const results = await componentRef.current.researchContact(contact, options);
      if (onResults) {
        onResults(results);
      }
      return results;
    }
    return null;
  };

  const getResults = () => {
    return componentRef.current ? componentRef.current.getResults() : null;
  };

  // Expose methods to parent component
  useEffect(() => {
    if (isLoaded && componentRef.current) {
      // Attach methods to ref for parent access
      containerRef.current.researchContact = researchContact;
      containerRef.current.getResults = getResults;
    }
  }, [isLoaded]);

  return (
    <div 
      ref={containerRef}
      id={`social-research-${Math.random().toString(36).substr(2, 9)}`}
      style={{ width: '100%', minHeight: '600px' }}
    />
  );
};

// Example usage component
const ExampleUsage = () => {
  const [results, setResults] = useState(null);
  const socialResearchRef = useRef(null);

  const handleResearchComplete = (results) => {
    setResults(results);
    console.log('Research completed:', results);
  };

  const manualResearch = () => {
    const contact = {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@techcorp.com',
      company: 'TechCorp Solutions',
      title: 'Marketing Director'
    };

    if (socialResearchRef.current) {
      socialResearchRef.current.researchContact(contact, {
        platforms: ['LinkedIn', 'Twitter', 'Instagram'],
        depth: 'comprehensive'
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Social Media Research Integration</h1>
      
      <button 
        onClick={manualResearch}
        style={{
          background: '#667eea',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Research Sample Contact
      </button>

      <SocialMediaResearch
        ref={socialResearchRef}
        apiKey={null} // Set your API key here
        mockMode={true} // Set to false for real API
        onResults={handleResearchComplete}
      />

      {results && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
          <h3>Research Results Summary:</h3>
          <p><strong>Profiles Found:</strong> {results.profiles.length}</p>
          <p><strong>Confidence Score:</strong> {results.confidenceScore}%</p>
          <p><strong>Last Researched:</strong> {results.lastResearched.toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
};

export default SocialMediaResearch;
export { ExampleUsage };
