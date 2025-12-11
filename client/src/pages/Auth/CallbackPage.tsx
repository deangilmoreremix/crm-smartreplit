import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase (this processes the URL hash tokens)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (session?.user) {
          // Check if user has a profile in our database
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileError);
            setError('Failed to load user profile. Please contact support.');
            return;
          }

          // If no profile exists, create one
          if (!profile) {
            // Super Admin emails get super_admin role automatically
            const superAdminEmails = [
              'dean@videoremix.io',
              'victor@videoremix.io', 
              'samuel@videoremix.io'
            ];
            
            const userEmail = session.user.email?.toLowerCase();
            let assignedRole = 'regular_user'; // Default role
            
            if (userEmail && superAdminEmails.includes(userEmail)) {
              assignedRole = 'super_admin';
            } else if (session.user.user_metadata?.role) {
              // Use role from invitation if provided
              assignedRole = session.user.user_metadata.role;
            }

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  username: session.user.email?.split('@')[0],
                  firstName: session.user.user_metadata?.first_name,
                  lastName: session.user.user_metadata?.last_name,
                  role: assignedRole,
                  appContext: 'smartcrm',
                  emailTemplateSet: 'smartcrm',
                }
              ]);

            if (insertError) {
              console.error('Profile creation error:', insertError);
              setError('Failed to create user profile. Please contact support.');
              return;
            }
          }

          // Success - redirect to dashboard
          navigate('/dashboard');
        } else {
          setError('No valid session found. Please try signing in again.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Completing Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we sign you in...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
              Authentication Error
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate('/auth/signin')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              data-testid="button-signin-retry"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}