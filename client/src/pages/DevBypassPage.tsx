import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const DevBypassPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performDevBypass = async () => {
      // SECURITY: Only allow dev bypass on localhost and .replit.dev, NOT on .replit.app
      const isDevelopmentEnvironment = (window.location.hostname.includes('localhost') || 
                                       window.location.hostname.includes('replit.dev')) &&
                                      !window.location.hostname.includes('replit.app');
      
      if (!isDevelopmentEnvironment) {
        console.error('🔒 Dev bypass blocked on production domain:', window.location.hostname);
        navigate('/signin', { replace: true });
        return;
      }

      try {
        // Performing dev bypass...

        // Call the dev bypass API endpoint
        const response = await fetch('/api/auth/dev-bypass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          throw new Error(`Dev bypass API failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.user && data.session) {
          // Store the dev session in localStorage
          localStorage.setItem('dev-user-session', JSON.stringify(data.user));
          localStorage.setItem('sb-supabase-auth-token', JSON.stringify(data.session));
          
          // Also store in the format the auth context expects
          localStorage.setItem('smartcrm-dev-mode', 'true');
          localStorage.setItem('smartcrm-dev-user', JSON.stringify(data.user));
          
          // Dev session stored successfully

          // Force immediate redirect with replace to avoid back button issues
          window.location.href = '/dashboard';
        } else {
          throw new Error('Invalid dev bypass response');
        }

      } catch (error) {
        console.error('Dev bypass failed:', error);

        // Fallback: create session manually
        const fallbackUser = {
          id: 'dev-user-12345',
          email: 'dev@smartcrm.local',
          username: 'developer',
          firstName: 'Development',
          lastName: 'User',
          role: 'super_admin',
          productTier: 'super_admin',
          app_context: 'smartcrm',
          created_at: new Date().toISOString()
        };

        const fallbackSession = {
          access_token: 'dev-bypass-token-fallback',
          refresh_token: 'dev-bypass-refresh-fallback',
          expires_at: Date.now() + (24 * 60 * 60 * 1000),
          user: fallbackUser
        };

        localStorage.setItem('dev-user-session', JSON.stringify(fallbackUser));
        localStorage.setItem('sb-supabase-auth-token', JSON.stringify(fallbackSession));

        console.log('Fallback dev session created');

        console.log('✅ Fallback dev session created');
        window.location.href = '/dashboard';
      }
    };

    performDevBypass();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-4">
        <div className="mb-6">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          🚀 Setting up Development Access
        </h2>
        <p className="text-gray-600 mb-4">
          Bypassing authentication for development...
        </p>
        <div className="mt-4 text-sm text-green-600 font-medium">
          Redirecting to dashboard...
        </div>
      </div>
    </div>
  );
};

export default DevBypassPage;