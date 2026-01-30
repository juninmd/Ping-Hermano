/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandleRequest, cancelRequest } from './requestHandler';

describe('handleRequest Cancellation', () => {
  let mockRun;
  let handleRequest;
  let mockAbort;

  beforeEach(() => {
    mockAbort = vi.fn();
    mockRun = vi.fn((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                // Keep it running/pending
                // Store callbacks to resolve later if needed
            },
            abort: mockAbort
        };
        callback(null, runObj);
    });

    const mockRuntime = {
        Runner: vi.fn(function() {
            this.run = mockRun;
        })
    };
    handleRequest = createHandleRequest(mockRuntime);
  });

  it('should store and cancel request', async () => {
    // Start request
    const requestId = 'req-123';
    handleRequest({ url: 'http://test.com', requestId });

    // Cancel it
    const result = cancelRequest(requestId);
    expect(result).toBe(true);
    expect(mockAbort).toHaveBeenCalled();

    // Cancel again should fail
    const result2 = cancelRequest(requestId);
    expect(result2).toBe(false);
  });

  it('should handle cancel error gracefully', () => {
     mockAbort.mockImplementation(() => { throw new Error('Abort failed'); });
     const requestId = 'req-fail';
     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

     handleRequest({ url: 'http://test.com', requestId });
     cancelRequest(requestId);

     expect(consoleSpy).toHaveBeenCalledWith('Error aborting request:', expect.any(Error));
     consoleSpy.mockRestore();
  });

  it('should handle done without request callback', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                // No request callback
                callbacks.done(null, {});
            }
        };
        callback(null, runObj);
    });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.status).toBe(0);
    expect(result.statusText).toBe('No Response');
  });
});
