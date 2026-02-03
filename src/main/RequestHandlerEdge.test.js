import { describe, it, expect, vi } from 'vitest';
import { createHandleRequest } from './requestHandler';

describe('RequestHandler Edge Cases', () => {
  it('should handle errorData from request callback in done callback', async () => {
    const mockRun = {
      start: vi.fn((callbacks) => {
        // 1. Trigger request callback with an error
        if (callbacks.request) {
            callbacks.request(new Error('Request Callback Error'), {}, {}, {}, {}, {}, {});
        }

        // 2. Trigger done callback with NO error (so it uses errorData)
        if (callbacks.done) {
            callbacks.done(null, {});
        }
      }),
      abort: vi.fn()
    };

    const mockRunner = vi.fn(function() {
      this.run = vi.fn((collection, options, callback) => {
        callback(null, mockRun);
      });
    });

    const mockRuntime = {
      Runner: mockRunner
    };

    const handleRequest = createHandleRequest(mockRuntime);

    const result = await handleRequest({
      url: 'http://example.com',
      method: 'GET'
    });

    expect(result.status).toBe(0);
    expect(result.error).toBe('Request Callback Error');
  });
});
