import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const next = searchParams.get('next');

      console.log('🔐 Auth callback:', { tokenHash: !!tokenHash, type, next });

      if (tokenHash && type === 'recovery') {
        // For password recovery, redirect to reset-password with token_hash
        // The ResetPassword component will handle the token exchange
        navigate(`/auth/reset-password?token_hash=${tokenHash}&type=recovery`, {
          replace: true
        });
      } else if (tokenHash && type === 'email_change') {
        // Email change confirmation
        navigate(`/auth/confirm?token_hash=${tokenHash}&type=email_change`, {
          replace: true
        });
      } else if (tokenHash && type === 'signup') {
        // Email confirmation
        navigate(`/auth/confirm?token_hash=${tokenHash}&type=signup`, {
          replace: true
        });
      } else {
        // Unknown callback type, redirect to login
        console.warn('Unknown callback type:', type);
        navigate('/auth/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid #e5e7eb',
          borderTopColor: '#16a34a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#374151' }}>Processing your authentication...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthCallback;
