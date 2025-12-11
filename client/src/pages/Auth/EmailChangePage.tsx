import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailChangePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailChange = async () => {
      try {
        // Get the session from URL hash parameters
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // Try to handle hash-based tokens from email links
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            // Token is valid, email change should be complete
            setSuccess(true);
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          } else {
            setError('Invalid or expired email change link. Please request a new one.');
          }
        } else {
          // Valid session means email change was successful
          setSuccess(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (err) {
        console.error('Email change validation error:', err);
        setError('Failed to validate email change. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleEmailChange();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Processing Email Change
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we update your email address...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              Email Updated Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Your email address has been successfully updated. You will be redirected to your dashboard shortly.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
              Email Change Failed
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors w-full"
                data-testid="button-dashboard"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors w-full"
                data-testid="button-profile"
              >
                Try Again from Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}