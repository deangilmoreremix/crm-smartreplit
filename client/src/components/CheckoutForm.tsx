import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CreditCard, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';

interface CreditPackage {
  id: string;
  planName: string;
  displayName: string;
  description: string;
  basePriceCents: number;
  credits: number;
  features: string[];
  popular?: boolean;
  bonusCredits?: number;
}

interface CheckoutFormProps {
  package: CreditPackage;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ package: pkg, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message || 'Payment method creation failed');
        return;
      }

      // Process the purchase
      const response = await fetch('/api/billing/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: pkg.id,
          stripePaymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Purchase failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h3>
          <p className="text-gray-600 mb-4">
            You've successfully purchased {pkg.credits + (pkg.bonusCredits || 0)} AI credits.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              {pkg.credits + (pkg.bonusCredits || 0)} credits added to your account
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Complete Your Purchase
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{pkg.displayName}</span>
              <span>{formatPrice(pkg.basePriceCents)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Bonus Credits ({pkg.bonusCredits})</span>
              <span>FREE</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total Credits</span>
              <span>{pkg.credits + (pkg.bonusCredits || 0)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(pkg.basePriceCents)}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatPrice(pkg.basePriceCents)}
                <CreditCard className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-3 w-3 mr-1" />
            Secured by Stripe
          </div>
          <p>Your payment information is encrypted and secure.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;