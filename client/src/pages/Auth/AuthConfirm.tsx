import React, { type ReactNode, useEffect, useState } from 'react';

declare const URLSearchParams: new (url: string) => URLSearchParams;
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AuthConfirmProps {
  children?: ReactNode;
}

const AuthConfirm: React.FC<AuthConfirmProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your request...');

  useEffect(() => {
    const confirmAuth = async () => {
      try {
        // Check for PKCE flow (query params)
        const token_hash = searchParams.get('token_hash');
        const typeParam = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change' | 'magiclink' | 'reauthentication' | null;

        // Check for implicit flow (URL hash)
        const urlHash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(urlHash);
        const accessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');

        console.log('Auth confirmation:', {
          pkce: { token_hash: token_hash?.slice(0, 10) + '...', type: typeParam },
          implicit: { hasAccessToken: !!accessToken, type: hashType }
        });

        // Handle implicit flow (hash-based) - Supabase automatically processes this
        if (accessToken || hashType) {
          console.log('Detected implicit flow, waiting for Supabase to process session...');
          
          // Wait a moment for Supabase to process the hash
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Check if this is password recovery
            if (hashType === 'recovery' || hashType === 'password_recovery') {
              setStatus('success');
              setMessage('Password reset link verified! Redirecting to reset password...');
              setTimeout(() => navigate('/auth/reset-password'), 1000);
              return;
            }
            
            // Other flows go to dashboard
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          }
        }

        // Handle PKCE flow (query params)
        if (!token_hash || !typeParam) {
          // No valid auth flow detected
          setStatus('error');
          setMessage('Invalid authentication link. Please try again.');
          return;
        }

        // Get email from URL params (needed for OTP verification)
        const email = searchParams.get('email');
        
        // Verify the OTP token for PKCE flow
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data: _verifyData, error } = await supabase.auth.verifyOtp({
          email: email || undefined,
          token_hash: token_hash || '',
          type: (typeParam as 'recovery') || 'recovery'
        });

        if (error) {
          console.error('Verification error:', error);
          setStatus('error');
          
          if (error.message.includes('expired')) {
            setMessage('This link has expired. Please request a new one.');
          } else {
            setMessage(error.message || 'Verification failed. Please try again.');
          }
          return;
        }

        // Handle different flow types
        switch (typeParam) {
          case 'signup':
          case 'email':
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to your dashboard...');
            setTimeout(() => navigate('/dashboard'), 2000);
            break;

          case 'recovery':
            setStatus('success');
            setMessage('Password reset link verified! Redirecting to reset password...');
            setTimeout(() => navigate('/auth/reset-password'), 1500);
            break;

          case 'invite':
            setStatus('success');
            setMessage('Invitation accepted! Redirecting to complete your profile...');
            setTimeout(() => navigate('/dashboard'), 2000);
            break;

          case 'email_change':
            setStatus('success');
            setMessage('Email address updated successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 2000);
            break;

          case 'magiclink':
            setStatus('success');
            setMessage('Magic link verified! Redirecting to your dashboard...');
            setTimeout(() => navigate('/dashboard'), 2000);
            break;

          case 'reauthentication':
            setStatus('success');
            setMessage('Identity confirmed successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 1500);
            break;

          default:
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 2000);
        }

      } catch (error: unknown) {
        console.error('Auth confirmation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    confirmAuth();
  }, [searchParams, navigate]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Smart<span className="text-green-400">CRM</span>
          </h1>
        </div>
        
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-8 shadow-lg`}>
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className={`w-16 h-16 mx-auto mb-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Verifying</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Success!</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Verification Failed</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{message}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/auth/login')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
                    data-testid="button-go-to-login"
                  >
                    Go to Sign In
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className={`px-6 py-2 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } font-semibold rounded-lg transition-all duration-200`}
                    data-testid="button-go-home"
                  >
                    Go Home
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthConfirm;
