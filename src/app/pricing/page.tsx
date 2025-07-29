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
        'No custom branding',
        'Default styling only',
        'Limited to 1 generation per month',
      ],
      buttonText: isSignedIn ? 'Current Plan' : 'Get Started Free',
      buttonAction: handleFreeTier,
      icon: <Gift className="w-6 h-6" />,
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'per month',
      description: 'For serious content creators and educators',
      features: [
        'Unlimited course generations',
        'Unlimited marketing assets',
        'Watermark-free exports',
        'Custom logo & branding',
        'Custom colors & styling',
        'Priority email support',
        'Notion export integration (coming soon)',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto container-padding py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="mb-6">
            <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/50 shadow-sm">
              <span className="mr-2">💎</span>
              Simple, Transparent Pricing
            </span>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 text-balance">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto text-balance">
            Start free and scale as you grow. No hidden fees, no surprises. 
            Cancel anytime with just one click.
          </p>
        </div>



        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`card card-hover relative ${
                tier.popular 
                  ? 'ring-2 ring-indigo-500 scale-105' 
                  : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              <div className="p-8 lg:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className={`p-4 rounded-2xl ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tier.icon}
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-3">
                    {tier.name}
                  </h3>
                  <p className="text-slate-600 mb-6 text-lg">
                    {tier.description}
                  </p>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-slate-900">
                      {tier.price}
                    </span>
                    <span className="text-slate-600 ml-3 text-lg">
                      {tier.period}
                    </span>
                  </div>
                  {tier.name === 'Pro' && (
                    <p className="text-sm text-green-600 font-medium">
                      Save $36 with annual billing
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-bold text-slate-900 mb-6 text-lg">
                    Everything included:
                  </h4>
                  <ul className="space-y-4">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-slate-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <span>⚠️</span>
                      Free tier limitations:
                    </h4>
                    <ul className="space-y-2">
                      {tier.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start">
                          <X className="w-4 h-4 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-orange-700 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={tier.buttonAction}
                  disabled={isLoading === tier.name.toLowerCase()}
                  className={`btn w-full btn-lg ${
                    tier.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {isLoading === tier.name.toLowerCase() ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {tier.buttonText}
                      {tier.popular && <span className="ml-2">→</span>}
                    </>
                  )}
                </button>
                
                {tier.name === 'Free' && (
                  <p className="text-center text-sm text-slate-500 mt-4">
                    No credit card required
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about our pricing
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="card p-8">
              <h3 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-3">
                <span className="text-2xl">💳</span>
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Absolutely! You can cancel your Pro subscription at any time with just one click. 
                You'll continue to have access to all Pro features until the end of your current billing period, 
                and we'll send you a reminder before your access expires.
              </p>
            </div>
            <div className="card p-8">
              <h3 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-3">
                <span className="text-2xl">📚</span>
                What happens to my courses if I downgrade?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                All your previously generated courses remain accessible forever. However, 
                you'll be limited to the free tier restrictions for new generations and exports. 
                Your existing Pro-quality exports will always remain available for download.
              </p>
            </div>
            <div className="card p-8">
              <h3 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                What does custom branding include?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Custom branding gives you complete control over your course appearance. Upload your logo, 
                choose your brand colors, add custom footer text, and remove all watermarks from exports. 
                Perfect for agencies, consultants, and businesses who want professional-looking course materials 
                that match their brand identity.
              </p>
            </div>
            <div className="card p-8">
              <h3 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                Do you offer refunds?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied with TweetToCourse Pro, 
                contact us within 30 days of your purchase for a full refund, no questions asked.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 text-center">
          <div className="card max-w-2xl mx-auto p-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              Ready to Start Creating?
            </h3>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of content creators who are already monetizing their knowledge
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleFreeTier}
                className="btn btn-secondary btn-lg"
              >
                Start Free
              </button>
              <button
                onClick={handleProSubscription}
                className="btn btn-primary btn-lg"
              >
                Go Pro Now
                <span className="ml-2">→</span>
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-6">
              No credit card required for free plan • Upgrade anytime
            </p>
          </div>
        </div>


      </div>
    </div>
  );
}