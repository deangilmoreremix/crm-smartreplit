import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Sparkles,
  Zap,
  Star,
  Check,
  ArrowRight,
  Shield,
  Clock,
  Gift
} from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_placeholder');

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

const CreditPurchasePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    loadCreditPackages();
  }, [user, navigate]);

  const loadCreditPackages = async () => {
    try {
      const response = await fetch('/api/billing/credit-packages');
      if (response.ok) {
        const data = await response.json();
        // Transform and enhance the packages with generous offerings
        const enhancedPackages: CreditPackage[] = data.packages.map((pkg: any) => ({
          ...pkg,
          bonusCredits: Math.floor(pkg.credits * 0.25), // 25% bonus
          features: [
            `${pkg.credits + (pkg.bonusCredits || 0)} AI Credits Total`,
            ...(pkg.bonusCredits ? [`${pkg.bonusCredits} Bonus Credits Included`] : []),
            'Never Expires',
            'Use for Any AI Tool',
            'Priority Processing',
            'Advanced AI Models Access',
            'Real-time Usage Tracking'
          ]
        }));

        // Add a popular flag to the middle package
        if (enhancedPackages.length >= 3) {
          enhancedPackages[1].popular = true;
        }

        setPackages(enhancedPackages);
      }
    } catch (error) {
      console.error('Error loading credit packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowCheckout(true);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getCreditsPerDollar = (credits: number, priceCents: number) => {
    return (credits / (priceCents / 100)).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCheckout && selectedPackage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowCheckout(false)}
              className="mb-4"
            >
              ← Back to Packages
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Purchase {selectedPackage.displayName}
            </h1>
            <p className="text-gray-600">
              {selectedPackage.credits + (selectedPackage.bonusCredits || 0)} Credits for {formatPrice(selectedPackage.basePriceCents)}
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              package={selectedPackage}
              onSuccess={() => {
                navigate('/billing');
              }}
            />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-yellow-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">AI Credit Packages</h1>
              <Sparkles className="h-8 w-8 text-yellow-500 ml-3" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supercharge your productivity with generous AI credit packages.
              Get bonus credits and unlock unlimited potential with our advanced AI tools.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Value Proposition */}
        <div className="text-center mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Gift className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">25% Bonus Credits</h3>
              <p className="text-gray-600">Get extra credits on every purchase</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Never Expires</h3>
              <p className="text-gray-600">Use your credits whenever you need them</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Protected by Stripe's enterprise security</p>
            </div>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                pkg.popular
                  ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                  : 'hover:shadow-lg'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-2">
                  <Star className="h-4 w-4 inline mr-1" />
                  Most Popular
                </div>
              )}

              <CardHeader className={`text-center ${pkg.popular ? 'pt-12' : ''}`}>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {pkg.displayName}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {pkg.description}
                </CardDescription>

                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(pkg.basePriceCents)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getCreditsPerDollar(pkg.credits, pkg.basePriceCents)} credits per $
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-lg font-semibold text-green-800">
                    {pkg.credits + (pkg.bonusCredits || 0)} Credits Total
                  </div>
                  <div className="text-sm text-green-600">
                    {pkg.credits} + {pkg.bonusCredits} bonus credits
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  size="lg"
                >
                  Get Credits Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Why Choose Our AI Credits?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">25%</div>
                <div className="text-sm text-gray-600">Bonus Credits</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Never Expires</div>
              </div>
              <div className="text-center">
                <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Instant Access</div>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Secure & Private</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  What can I use AI credits for?
                </h4>
                <p className="text-gray-600">
                  AI credits can be used for any of our AI tools including the AI Assistant, Vision Analyzer,
                  Image Generator, Function Assistant, and all other AI-powered features in the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Do credits expire?
                </h4>
                <p className="text-gray-600">
                  No, your AI credits never expire. You can use them whenever you're ready.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Can I share credits with my team?
                </h4>
                <p className="text-gray-600">
                  Credits are tied to your account. Team members use their own credits for AI operations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchasePage;