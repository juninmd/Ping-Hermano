/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { createHandleRequest, cancelRequest } from './requestHandler';

describe('requestHandler Gap', () => {
    it('should clean up activeRuns after request completes', async () => {
        const mockRun = vi.fn((collection, options, callback) => {
            const runObj = {
                start: (callbacks) => {
                    // Immediate completion
                    callbacks.done(null, {});
                },
                abort: vi.fn()
            };
            callback(null, runObj);
        });

        const mockRuntime = {
            Runner: vi.fn(function() {
                this.run = mockRun;
            })
        };

        const handleRequest = createHandleRequest(mockRuntime);
        const requestId = 'req-gap-1';

        // 1. Start request
        await handleRequest({ url: 'http://test.com', requestId });

        // 2. Try to cancel it - should return false because it's already done and cleaned up
        const cancelled = cancelRequest(requestId);
        expect(cancelled).toBe(false);
    });
});
