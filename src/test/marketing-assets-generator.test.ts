import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMarketingAssets, formatMarketingAssetsForDownload } from '@/lib/marketing-assets-generator';

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

describe('Marketing Assets Generator', () => {
  const mockOpenAI = vi.mocked(require('openai').OpenAI);
  let mockCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate = vi.fn();
    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));
  });

  describe('generateMarketingAssets', () => {
    it('should generate marketing assets successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              coldDMs: [
                "Hey [Name], saw your recent post about [topic]. I just created a mini-course that shows exactly how to [benefit]. Mind if I share it?",
                "Hi [Name], love your content on [topic]! I put together a quick guide that complements what you're teaching. Would you like to check it out?"
              ],
              adCopyTemplate: {
                facebook: "🚀 Master [SKILL] in [TIMEFRAME]!\n\nDiscover the exact system that helped [YOUR_RESULT].\n\n✅ Step-by-step framework\n✅ Real examples\n✅ Actionable takeaways\n\nGet instant access → [LINK]",
                twitter: "The [SKILL] framework that changed everything 🧵\n\nI just turned my best insights into a mini-course.\n\n[YOUR_RESULT] in [TIMEFRAME]\n\nFree access: [LINK]",
                instagram: "POV: You finally understand [SKILL] 💡\n\nThis mini-course breaks down:\n→ [BENEFIT_1]\n→ [BENEFIT_2] \n→ [BENEFIT_3]\n\nLink in bio 👆"
              },
              spreadsheetTemplate: {
                headers: ["Traffic Source", "Ad Spend", "Clicks", "Conversions", "Conversion Rate", "Cost Per Conversion", "ROI"],
                sampleData: [
                  ["Facebook Ads", "$100", "500", "25", "5%", "$4.00", "250%"],
                  ["Twitter Ads", "$50", "200", "8", "4%", "$6.25", "160%"],
                  ["Organic Social", "$0", "300", "15", "5%", "$0", "∞"]
                ],
                description: "Track your marketing performance across different channels. Update daily to monitor ROI and optimize spend allocation."
              },
              bonusResource: {
                type: "checklist",
                title: "Course Launch Checklist",
                content: [
                  "Create compelling course title and description",
                  "Design eye-catching cover art or thumbnail",
                  "Write 3-5 cold DM templates for outreach",
                  "Set up tracking spreadsheet for metrics",
                  "Create social media content calendar",
                  "Prepare email sequences for nurturing",
                  "Test all download links and forms",
                  "Schedule launch announcement posts"
                ]
              }
            })
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generateMarketingAssets(
        'Test Course',
        'Module 1: Introduction\nModule 2: Advanced Topics',
        'Original tweet content',
        'Entrepreneurs'
      );

      expect(result).toBeDefined();
      expect(result.coldDMs).toHaveLength(2);
      expect(result.adCopyTemplate.facebook).toContain('[SKILL]');
      expect(result.spreadsheetTemplate.headers).toContain('Traffic Source');
      expect(result.bonusResource.type).toBe('checklist');
    });

    it('should handle OpenAI API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(generateMarketingAssets(
        'Test Course',
        'Test content',
        'Test tweet'
      )).rejects.toThrow('Failed to generate marketing assets');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(generateMarketingAssets(
        'Test Course',
        'Test content',
        'Test tweet'
      )).rejects.toThrow('Failed to generate marketing assets');
    });
  });

  describe('formatMarketingAssetsForDownload', () => {
    it('should format marketing assets correctly', () => {
      const mockAssets = {
        coldDMs: [
          "Test DM 1",
          "Test DM 2"
        ],
        adCopyTemplate: {
          facebook: "Facebook ad template",
          twitter: "Twitter ad template",
          instagram: "Instagram ad template"
        },
        spreadsheetTemplate: {
          headers: ["Source", "Spend", "ROI"],
          sampleData: [["Facebook", "$100", "200%"]],
          description: "Test description"
        },
        bonusResource: {
          type: "checklist" as const,
          title: "Test Checklist",
          content: ["Item 1", "Item 2"]
        }
      };

      const result = formatMarketingAssetsForDownload(mockAssets, 'Test Course');

      expect(result).toContain('# Marketing Assets for "Test Course"');
      expect(result).toContain('## 🔥 Cold DMs & Outreach Messages');
      expect(result).toContain('Test DM 1');
      expect(result).toContain('Facebook ad template');
      expect(result).toContain('Test Checklist');
      expect(result).toContain('1. Item 1');
    });
  });
});