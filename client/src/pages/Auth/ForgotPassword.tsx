import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase, auth, isSupabaseConfigured } from '../../lib/supabase';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError('Authentication service is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await auth.resetPassword(email);
      
      if (resetError) {
        console.error('Error sending reset password email:', resetError);
        
        // Handle rate limit error specifically
        if (resetError.status === 429 || resetError.message?.includes('rate_limit')) {
          setError('Too many password reset requests. Please wait 1 hour before trying again.');
        } else {
          setError(resetError.message || 'An error occurred while sending the reset link');
        }
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (error: any) {
      console.error('Error sending reset password email:', error);
      
      // Handle rate limit error in catch block
      if (error.status === 429 || error.message?.includes('rate_limit')) {
        setError('Too many password reset requests. Please wait 1 hour before trying again.');
      } else {
        setError(error.message || 'An error occurred while sending the reset link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Smart<span className="text-green-400">CRM</span>
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Reset your password
          </p>
        </div>
        
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-8 shadow-lg`}>
          {error && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border flex items-center space-x-2`}>
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</span>
            </div>
          )}

          {success && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border flex items-center space-x-2`}>
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                Password reset link sent! Please check your email and follow the instructions.
              </span>
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 pl-10 border rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  data-testid="input-email"
                />
              </div>
              <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                We'll send you a link to reset your password
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              data-testid="button-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Reset Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              to="/auth/login"
              className={`flex items-center ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
