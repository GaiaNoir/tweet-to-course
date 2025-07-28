/**
 * Super Simple Auth System
 * No database, no complex metadata - just localStorage for testing
 */

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface User {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  usageCount: number;
  monthlyUsageCount: number;
}

// Simple in-memory user for testing
let currentUser: User | null = null;

/**
 * Initialize a test user
 */
export function initTestUser(): User {
  const user: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    subscriptionTier: 'pro', // Default to pro for testing
    usageCount: 0,
    monthlyUsageCount: 0,
  };
  
  currentUser = user;
  
  // Also store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('tweet-to-course-user', JSON.stringify(user));
  }
  
  return user;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  // First check memory
  if (currentUser) {
    return currentUser;
  }
  
  // Then check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tweet-to-course-user');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }
  
  // If no user found, create a test user
  return initTestUser();
}

/**
 * Update user subscription
 */
export function updateUserSubscription(tier: SubscriptionTier): User {
  const user = getCurrentUser();
  if (user) {
    user.subscriptionTier = tier;
    currentUser = user;
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('tweet-to-course-user', JSON.stringify(user));
    }
  }
  return user!;
}

/**
 * Increment usage count
 */
export function incrementUsage(): User {
  const user = getCurrentUser();
  if (user) {
    user.usageCount++;
    user.monthlyUsageCount++;
    currentUser = user;
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('tweet-to-course-user', JSON.stringify(user));
    }
  }
  return user!;
}

/**
 * Check if user can perform action
 */
export function canPerformAction(action: 'generate' | 'export_pdf' | 'export_notion'): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  switch (action) {
    case 'generate':
      return user.subscriptionTier === 'free' 
        ? user.monthlyUsageCount < 1 
        : true;
    
    case 'export_pdf':
      return true; // All users can export PDF
    
    case 'export_notion':
      return user.subscriptionTier === 'pro' || user.subscriptionTier === 'lifetime';
    
    default:
      return false;
  }
}

/**
 * Reset user data (for testing)
 */
export function resetUser(): void {
  currentUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tweet-to-course-user');
  }
}