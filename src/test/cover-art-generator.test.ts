import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadImageAsBase64, base64ToBlob } from '@/lib/cover-art-generator';
import { OpenAIError } from '@/lib/openai';

// Mock OpenAI module
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: {
      generate: vi.fn(),
    },
  })),
}));

// Mock fetch for downloadImageAsBase64
global.fetch = vi.fn();

describe('Cover Art Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('downloadImageAsBase64', () => {
    it('should download and convert image to base64', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await downloadImageAsBase64('https://example.com/image.png');

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png');
    });

    it('should handle fetch errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(downloadImageAsBase64('https://example.com/invalid.png'))
        .rejects.toThrow(OpenAIError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(downloadImageAsBase64('https://example.com/image.png'))
        .rejects.toThrow(OpenAIError);
    });
  });

  describe('base64ToBlob', () => {
    it('should convert base64 to blob', () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const blob = base64ToBlob(base64Data, 'image/png');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle base64 without data URL prefix', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const blob = base64ToBlob(base64Data, 'image/jpeg');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });
  });
});