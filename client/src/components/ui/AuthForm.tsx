/**
 * Simple Email/Password Authentication Form
 * Focused on email/password sign up, login, and password reset.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  resetPasswordForEmail,
  updateUser,
  signOut,
  getCurrentUser
} from '../../services/authService';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

type AuthMode = 'login' | 'signup' | 'reset-password' | 'update-password';

export interface AuthFormProps {
  mode?: 'login' | 'signup';
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  redirectAfterLogin?: string;
}

export function AuthForm({ mode: initialMode = 'login', onSuccess, onError, redirectAfterLogin }: AuthFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Auth state
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };
  
  // Check for reset password token in URL
  useEffect(() => {
    const checkAuth = async () => {
      if (searchParams.get('type') === 'recovery') {
        setMode('update-password');
      }
    };
    checkAuth();
  }, [searchParams]);
  
  // Email/Password Sign Up
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await signUpWithEmail(email, password);
      
      if (error) {
        showMessage('error', error.message);
        onError?.(error);
      } else {
        showMessage('success', 'Sign up successful! Check your email to confirm your account.');
        onSuccess?.(data);
      }
    } catch (err: any) {
      showMessage('error', err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        showMessage('error', error.message);
        onError?.(error);
      } else {
        showMessage('success', 'Welcome back!');
        onSuccess?.(data);
        if (redirectAfterLogin) navigate(redirectAfterLogin);
      }
    } catch (err: any) {
      showMessage('error', err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Password Reset Request
  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await resetPasswordForEmail(email);
      
      if (error) {
        showMessage('error', error.message);
        onError?.(error);
      } else {
        showMessage('success', 'Reset email sent! Check your inbox.');
        onSuccess?.(data);
        setMode('login');
      }
    } catch (err: any) {
      showMessage('error', err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update Password (after reset)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await updateUser({ password });
      
      if (error) {
        showMessage('error', error.message);
        onError?.(error);
      } else {
        showMessage('success', 'Password updated successfully!');
        onSuccess?.(data);
        await signOut();
        navigate('/login');
      }
    } catch (err: any) {
      showMessage('error', err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Render methods
  const renderSignupForm = () => (
    <form onSubmit={handleEmailSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
  
  const renderLoginForm = () => (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
  
  const renderPasswordResetForm = () => (
    <form onSubmit={handlePasswordResetRequest} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resetEmail">Email</Label>
        <Input
          id="resetEmail"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>
      <Button 
        type="button" 
        variant="outline" 
        className="w-full"
        onClick={() => setMode('login')}
      >
        Back to Login
      </Button>
    </form>
  );
  
  const renderUpdatePasswordForm = () => (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="updateConfirmPassword">Confirm New Password</Label>
        <Input
          id="updateConfirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
  
  // Message display
  const renderMessage = () => {
    if (!message) return null;
    return (
      <div className={`p-3 rounded mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {message.text}
      </div>
    );
  };
  
  // Main render
  if (mode === 'reset-password') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {renderMessage()}
          {renderPasswordResetForm()}
        </CardContent>
      </Card>
    );
  }
  
  if (mode === 'update-password') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          {renderMessage()}
          {renderUpdatePasswordForm()}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>
          {mode === 'signup' ? 'Sign up with your email and password' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderMessage()}
        
        {mode === 'login' ? renderLoginForm() : renderSignupForm()}
        
        <div className="text-center text-sm mt-4">
          {mode === 'login' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('reset-password')}
                className="text-primary hover:underline"
              >
                Forgot Password?
              </button>
              <p className="mt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthForm;
