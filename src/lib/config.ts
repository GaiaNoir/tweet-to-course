// Application configuration
export const config = {
  app: {
    name: 'TweetToCourse',
    description: 'Turn your threads into sellable courses in seconds',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Subscription tiers
  subscriptionTiers: {
    free: {
      name: 'Free',
      price: 0,
      monthlyGenerations: 1,
      features: {
        pdfExport: true,
        notionExport: false,
        watermarkFree: false,
        customBranding: false,
      },
    },
    pro: {
      name: 'Pro',
      price: 9,
      monthlyGenerations: -1, // unlimited
      features: {
        pdfExport: true,
        notionExport: true,
        watermarkFree: true,
        customBranding: true,
      },
    },
    lifetime: {
      name: 'Lifetime',
      price: 49,
      monthlyGenerations: -1, // unlimited
      features: {
        pdfExport: true,
        notionExport: true,
        watermarkFree: true,
        customBranding: true,
      },
    },
  },
  
  // Course generation settings
  courseGeneration: {
    maxModules: 5,
    maxTakeawaysPerModule: 3,
    loadingMessage: "We're alchemizing your thread...",
  },
} as const;

export type SubscriptionTier = keyof typeof config.subscriptionTiers;