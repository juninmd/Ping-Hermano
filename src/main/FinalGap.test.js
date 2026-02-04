import { vi, describe, it, expect } from 'vitest';
import { createHandleRequest, cancelRequest } from './requestHandler';

describe('FinalGap Main Process', () => {
    it('should cleanup activeRuns after request completes', async () => {
        const requestId = 'cleanup-test-id';
        let doneCallback;
        let startCallbacks;

        const mockRun = {
            start: vi.fn((callbacks) => {
                startCallbacks = callbacks;
                // Don't call done immediately, let us control it
            }),
            abort: vi.fn()
        };

        const mockRunner = {
            run: vi.fn((collection, options, cb) => {
                cb(null, mockRun);
            })
        };

        // Needs to be a constructor
        const MockRunnerClass = vi.fn(function() {
            return mockRunner;
        });

        const mockRuntime = {
            Runner: MockRunnerClass,
            VariableScope: vi.fn()
        };

        const handleRequest = createHandleRequest(mockRuntime);

        // 1. Start request
        const requestPromise = handleRequest({ url: 'http://test.com', requestId });

        // Wait for run.start to be called
        await new Promise(resolve => setTimeout(resolve, 0));

        // 2. Verify it is active (cancelRequest returns true)
        // NOTE: cancelRequest removes it, so we can't use it to just "peek".
        // But we want to test the "done" callback specifically.

        // Let's rely on the fact that if "done" DOES NOT remove it, it stays there forever.
        // So if we finish the request, and THEN call cancelRequest, it should return false.

        // Execute done callback
        expect(startCallbacks).toBeDefined();
        startCallbacks.done(null, {});

        await requestPromise;

        // 3. Try to cancel. It should return false because it should have been removed.
        const result = cancelRequest(requestId);
        expect(result).toBe(false);
    });

    it('should have added it to activeRuns initially', async () => {
        const requestId = 'active-test-id';

        const mockRun = {
            start: vi.fn(),
            abort: vi.fn()
        };

        const mockRunner = {
            run: vi.fn((collection, options, cb) => {
                cb(null, mockRun);
            })
        };

        const MockRunnerClass = vi.fn(function() {
            return mockRunner;
        });

        const mockRuntime = {
            Runner: MockRunnerClass,
            VariableScope: vi.fn()
        };

        const handleRequest = createHandleRequest(mockRuntime);

        // Start
        handleRequest({ url: 'http://test.com', requestId });

        await new Promise(resolve => setTimeout(resolve, 0));

        // Check if it's there by cancelling it
        const result = cancelRequest(requestId);
        expect(result).toBe(true);
    });
});
