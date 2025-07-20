import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbUser, DbCourse, DbUsageLog } from '@/types/database';

// Mock Supabase
const mockSupabaseResponse = {
  data: null,
  error: null,
};

// Mock the supabase module
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => mockSupabaseResponse),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => mockSupabaseResponse),
          order: vi.fn(() => ({
            range: vi.fn(() => mockSupabaseResponse),
          })),
          range: vi.fn(() => mockSupabaseResponse),
          gte: vi.fn(() => mockSupabaseResponse),
          limit: vi.fn(() => mockSupabaseResponse),
        })),
        limit: vi.fn(() => mockSupabaseResponse),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => mockSupabaseResponse),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => mockSupabaseResponse),
      })),
    })),
    raw: vi.fn((sql: string) => sql),
  };

  return {
    supabase: mockSupabase,
    supabaseAdmin: mockSupabase,
    handleSupabaseError: vi.fn((error) => {
      throw new Error(error.message || 'Database operation failed');
    }),
  };
});

// Import after mocking
import { UserService, CourseService, UsageService, DatabaseService } from '@/lib/database';

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        clerk_user_id: 'clerk_123',
        email: 'test@example.com',
        subscription_tier: 'free' as const,
      };

      const expectedUser: DbUser = {
        id: 'user_123',
        clerk_user_id: 'clerk_123',
        email: 'test@example.com',
        subscription_tier: 'free',
        usage_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseResponse.data = expectedUser;
      mockSupabaseResponse.error = null;

      const result = await UserService.createUser(userData);

      expect(result).toEqual(expectedUser);
    });

    it('should handle creation errors', async () => {
      const userData = {
        clerk_user_id: 'clerk_123',
        email: 'test@example.com',
      };

      mockSupabaseResponse.data = null;
      mockSupabaseResponse.error = { message: 'Duplicate key error' };

      await expect(UserService.createUser(userData)).rejects.toThrow('Duplicate key error');
    });
  });

  describe('getUserByClerkId', () => {
    it('should retrieve user by Clerk ID', async () => {
      const expectedUser: DbUser = {
        id: 'user_123',
        clerk_user_id: 'clerk_123',
        email: 'test@example.com',
        subscription_tier: 'free',
        usage_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseResponse.data = expectedUser;
      mockSupabaseResponse.error = null;

      const result = await UserService.getUserByClerkId('clerk_123');

      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      mockSupabaseResponse.data = null;
      mockSupabaseResponse.error = { code: 'PGRST116' }; // Not found error

      const result = await UserService.getUserByClerkId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getOrCreateUser', () => {
    it('should return existing user if found', async () => {
      const existingUser: DbUser = {
        id: 'user_123',
        clerk_user_id: 'clerk_123',
        email: 'test@example.com',
        subscription_tier: 'free',
        usage_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getUserByClerkId to return existing user
      vi.spyOn(UserService, 'getUserByClerkId').mockResolvedValue(existingUser);

      const result = await UserService.getOrCreateUser('clerk_123', 'test@example.com');

      expect(result).toEqual(existingUser);
      expect(UserService.getUserByClerkId).toHaveBeenCalledWith('clerk_123');
    });

    it('should create new user if not found', async () => {
      const newUser: DbUser = {
        id: 'user_456',
        clerk_user_id: 'clerk_456',
        email: 'new@example.com',
        subscription_tier: 'free',
        usage_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getUserByClerkId to return null (user not found)
      vi.spyOn(UserService, 'getUserByClerkId').mockResolvedValue(null);
      vi.spyOn(UserService, 'createUser').mockResolvedValue(newUser);

      const result = await UserService.getOrCreateUser('clerk_456', 'new@example.com');

      expect(result).toEqual(newUser);
      expect(UserService.createUser).toHaveBeenCalledWith({
        clerk_user_id: 'clerk_456',
        email: 'new@example.com',
        subscription_tier: 'free',
        usage_count: 0,
      });
    });
  });
});

describe('CourseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a new course successfully', async () => {
      const courseData = {
        user_id: 'user_123',
        title: 'Test Course',
        original_content: 'Original tweet content',
        modules: [
          {
            id: 'module_1',
            title: 'Module 1',
            summary: 'Module summary',
            takeaways: ['Takeaway 1'],
            order: 1,
          },
        ],
      };

      const expectedCourse: DbCourse = {
        id: 'course_123',
        ...courseData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseResponse.data = expectedCourse;
      mockSupabaseResponse.error = null;

      const result = await CourseService.createCourse(courseData);

      expect(result).toEqual(expectedCourse);
    });
  });

  describe('getUserCourses', () => {
    it('should retrieve user courses with pagination', async () => {
      const courses: DbCourse[] = [
        {
          id: 'course_1',
          user_id: 'user_123',
          title: 'Course 1',
          original_content: 'Content 1',
          modules: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseResponse.data = courses;
      mockSupabaseResponse.error = null;

      const result = await CourseService.getUserCourses('user_123', 10, 0);

      expect(result).toEqual(courses);
    });

    it('should return empty array when no courses found', async () => {
      mockSupabaseResponse.data = null;
      mockSupabaseResponse.error = null;

      const result = await CourseService.getUserCourses('user_123');

      expect(result).toEqual([]);
    });
  });
});

describe('UsageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAction', () => {
    it('should log user action successfully', async () => {
      const logData = {
        user_id: 'user_123',
        action: 'generate' as const,
        metadata: { source: 'tweet' },
      };

      const expectedLog: DbUsageLog = {
        id: 'log_123',
        ...logData,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseResponse.data = expectedLog;
      mockSupabaseResponse.error = null;

      const result = await UsageService.logAction(logData);

      expect(result).toEqual(expectedLog);
    });
  });

  describe('hasExceededLimit', () => {
    it('should return false for pro users', async () => {
      const result = await UsageService.hasExceededLimit('user_123', 'pro');

      expect(result).toBe(false);
    });

    it('should return false for lifetime users', async () => {
      const result = await UsageService.hasExceededLimit('user_123', 'lifetime');

      expect(result).toBe(false);
    });

    it('should check monthly limit for free users', async () => {
      vi.spyOn(UsageService, 'getMonthlyUsageCount').mockResolvedValue(0);

      const result = await UsageService.hasExceededLimit('user_123', 'free');

      expect(result).toBe(false);
      expect(UsageService.getMonthlyUsageCount).toHaveBeenCalledWith('user_123', 'generate');
    });

    it('should return true when free user exceeds limit', async () => {
      vi.spyOn(UsageService, 'getMonthlyUsageCount').mockResolvedValue(1);

      const result = await UsageService.hasExceededLimit('user_123', 'free');

      expect(result).toBe(true);
    });
  });
});

describe('DatabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      mockSupabaseResponse.error = null;

      const result = await DatabaseService.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when database has errors', async () => {
      mockSupabaseResponse.error = { message: 'Connection failed' };

      const result = await DatabaseService.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return database statistics', async () => {
      // Mock Promise.all to return count results
      vi.spyOn(Promise, 'all').mockResolvedValue([
        { count: 5, error: null },
        { count: 10, error: null },
        { count: 15, error: null },
      ]);

      const result = await DatabaseService.getStats();

      expect(result).toEqual({
        totalUsers: 5,
        totalCourses: 10,
        totalUsageLogs: 15,
      });
    });
  });
});