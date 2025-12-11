import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get confirmation parameters from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const email = searchParams.get('email');

        if (!token || !type) {
          setError('Invalid confirmation link. Please check your email and try again.');
          return;
        }

        // Handle different confirmation types
        if (type === 'signup') {
          // Email confirmation for signup
          const { error: confirmError } = await supabase.auth.verifyOtp({
            token,
            type: 'email',
            email: email || ''
          });

          if (confirmError) {
            console.error('Email confirmation error:', confirmError);
            setError(confirmError.message || 'Failed to confirm email address.');
            return;
          }

          setSuccess(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);

        } else if (type === 'recovery') {
          // Password recovery confirmation
          const { error: recoveryError } = await supabase.auth.verifyOtp({
            token,
            type: 'recovery',
            email: email || ''
          });

          if (recoveryError) {
            console.error('Recovery confirmation error:', recoveryError);
            setError(recoveryError.message || 'Failed to confirm password reset.');
            return;
          }

          // Redirect to reset password page
          navigate('/auth/reset-password');

        } else if (type === 'email_change') {
          // Email change confirmation
          const { error: emailChangeError } = await supabase.auth.verifyOtp({
            token,
            type: 'email_change',
            email: email || ''
          });

          if (emailChangeError) {
            console.error('Email change confirmation error:', emailChangeError);
            setError(emailChangeError.message || 'Failed to confirm email change.');
            return;
          }

          setSuccess(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);

        } else {
          setError('Unknown confirmation type. Please contact support.');
        }

      } catch (err) {
        console.error('Confirmation error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Confirming Email
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we verify your email address...
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
              Email Confirmed!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Your email address has been successfully confirmed. You will be redirected to your dashboard shortly.
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
              Confirmation Failed
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/auth/signin')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors w-full"
                data-testid="button-signin"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/auth/forgot-password')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors w-full"
                data-testid="button-forgot-password"
              >
                Request New Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}