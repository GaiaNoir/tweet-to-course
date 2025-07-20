/**
 * Subscription utility functions that can be used on both client and server
 */

export interface SubscriptionLimits {
  monthlyGenerations: number; // -1 for unlimited
  pdfExports: boolean;
  notionExports: boolean;
  customBranding: boolean;
  watermarkFree: boolean;
}

/**
 * Get subscription tier limits
 */
export function getSubscriptionLimits(tier: 'free' | 'pro' | 'lifetime'): SubscriptionLimits {
  switch (tier) {
    case 'free':
      return {
        monthlyGenerations: 1,
        pdfExports: true,
        notionExports: false,
        customBranding: false,
        watermarkFree: false,
      };
    
    case 'pro':
    case 'lifetime':
      return {
        monthlyGenerations: -1, // unlimited
        pdfExports: true,
        notionExports: true,
        customBranding: true,
        watermarkFree: true,
      };
    
    default:
      return {
        monthlyGenerations: 0,
        pdfExports: false,
        notionExports: false,
        customBranding: false,
        watermarkFree: false,
      };
  }
}

/**
 * Check if user can perform an action based on their subscription tier and usage
 */
export function canPerformAction(
  subscriptionTier: 'free' | 'pro' | 'lifetime',
  usageCount: number,
  action: 'generate' | 'export_pdf' | 'export_notion' | 'remove_watermark'
): boolean {
  switch (action) {
    case 'generate':
      return subscriptionTier === 'free' 
        ? usageCount < 1 
        : true;
    
    case 'export_pdf':
      return true; // All users can export PDF
    
    case 'export_notion':
      return subscriptionTier === 'pro' || subscriptionTier === 'lifetime';
    
    case 'remove_watermark':
      return subscriptionTier === 'pro' || subscriptionTier === 'lifetime';
    
    default:
      return false;
  }
}

/**
 * Get subscription tier display information
 */
export function getSubscriptionTierInfo(tier: 'free' | 'pro' | 'lifetime') {
  switch (tier) {
    case 'free':
      return {
        name: 'Free',
        price: '$0',
        period: 'forever',
        color: 'gray',
        description: 'Perfect for trying out the platform',
      };
    
    case 'pro':
      return {
        name: 'Pro',
        price: '$19',
        period: 'per month',
        color: 'indigo',
        description: 'For serious content creators and educators',
      };
    
    case 'lifetime':
      return {
        name: 'Lifetime',
        price: '$149',
        period: 'one-time',
        color: 'gold',
        description: 'All Pro features, forever',
      };
    
    default:
      return {
        name: 'Unknown',
        price: '$0',
        period: '',
        color: 'gray',
        description: '',
      };
  }
}

/**
 * Check if user needs to upgrade for a specific feature
 */
export function needsUpgradeFor(
  subscriptionTier: 'free' | 'pro' | 'lifetime',
  feature: 'unlimited_generations' | 'notion_export' | 'watermark_free' | 'custom_branding'
): boolean {
  if (subscriptionTier === 'pro' || subscriptionTier === 'lifetime') {
    return false;
  }
  
  // Free users need upgrade for all premium features
  return true;
}

/**
 * Get upgrade message for a specific feature
 */
export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    unlimited_generations: 'Upgrade to Pro for unlimited course generations',
    notion_export: 'Upgrade to Pro to export courses to Notion',
    watermark_free: 'Upgrade to Pro to remove watermarks from exports',
    custom_branding: 'Upgrade to Pro for custom branding options',
  };
  
  return messages[feature] || 'Upgrade to Pro for premium features';
}