'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Check, X, Zap, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  buttonText: string;
  buttonAction: () => void;
  icon: React.ReactNode;
}

export default function PricingPage() {
  const { user, isSignedIn } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleFreeTier = () => {
    if (!isSignedIn) {
      router.push('/sign-up');
    } else {
      router.push('/dashboard');
    }
  };

  const handleProSubscription = async () => {
    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }

    setIsLoading('pro');
    try {
      // Use the Paystack payment link directly
      const paymentUrl = 'https://paystack.shop/pay/xbom5adxzi';
      
      // Add user metadata to the URL if possible, or redirect directly
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const pricingTiers: PricingTier[] = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out the platform',
      features: [
        '1 course generation per month',
        'Basic PDF export',
        'Email support',
        'Access to community',
      ],
      limitations: [
        'Watermarked exports',
        'No Notion export',
        'No custom branding',
        'Limited to 1 generation per month',
      ],
      buttonText: isSignedIn ? 'Current Plan' : 'Get Started Free',
      buttonAction: handleFreeTier,
      icon: <Gift className="w-6 h-6" />,
    },
    {
      name: 'Pro',
      price: '$7',
      period: 'per month',
      description: 'For serious content creators and educators',
      features: [
        'Unlimited course generations',
        'Unlimited marketing assets',
        'Watermark-free PDF exports',
        'Notion export integration',
        'Priority email support',
        'Cover art generation (coming soon)',
      ],
      limitations: [],
      popular: true,
      buttonText: 'Start Pro Trial',
      buttonAction: handleProSubscription,
      icon: <Zap className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your content creation needs. 
            Start free and upgrade when you&apos;re ready to scale.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                tier.popular 
                  ? 'border-indigo-500 scale-105' 
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      tier.popular ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tier.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {tier.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {tier.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    What's included:
                  </h4>
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Limitations:
                    </h4>
                    <ul className="space-y-3">
                      {tier.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start">
                          <X className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={tier.buttonAction}
                  disabled={isLoading === tier.name.toLowerCase()}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    tier.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50'
                  } disabled:cursor-not-allowed`}
                >
                  {isLoading === tier.name.toLowerCase() 
                    ? 'Processing...' 
                    : tier.buttonText
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your Pro subscription at any time. You&apos;ll continue to have access to Pro features until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my courses if I downgrade?
              </h3>
              <p className="text-gray-600">
                All your previously generated courses remain accessible. However, you&apos;ll be limited to the free tier restrictions for new generations and exports.
              </p>
            </div>

          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Need a custom solution?
          </h3>
          <p className="text-gray-600 mb-6">
            Contact us for enterprise pricing and custom integrations.
          </p>
          <a
            href="mailto:support@tweettocourse.com"
            className="inline-flex items-center px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}