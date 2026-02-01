import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandleRequest, cancelRequest } from './requestHandler';

describe('handleRequest cleanup verification', () => {
    let mockRuntime;
    let mockRunner;
    let handleRequest;

    beforeEach(() => {
        mockRunner = {
            run: vi.fn(),
        };
        mockRuntime = {
            Runner: vi.fn(function() { return mockRunner; }),
        };
        handleRequest = createHandleRequest(mockRuntime);
    });

    it('should explicitly clean up activeRuns when request finishes', async () => {
        const requestId = 'req-cleanup-test';
        const requestData = {
            url: 'http://example.com',
            method: 'GET',
            requestId: requestId
        };

        let runCallback;
        mockRunner.run.mockImplementation((collection, options, callback) => {
            runCallback = callback;
        });

        const promise = handleRequest(requestData);

        const mockRunObject = {
            start: vi.fn((callbacks) => {
                // Before done is called, the request should be active.
                // However, activeRuns is updated in the callback of runner.run, which we manually triggered.
                // But wait, activeRuns.set is called inside the callback passed to runner.run.
                // We are inside mockRunner.run implementation? No, we are simulating the callback invocation.
            }),
            abort: vi.fn()
        };

        // Trigger the callback from runner.run. This is where activeRuns.set is called.
        runCallback(null, mockRunObject);

        // At this point, activeRuns.set(requestId, run) should have been called.
        // We can verify this by trying to cancel it.
        // Note: cancelRequest calls abort(), so we expect mockRunObject.abort to be called if we cancel here.
        // But we want to test that 'done' removes it.

        // So let's trigger 'done'.
        // We need to capture the 'start' callbacks.
        const startCalls = mockRunObject.start.mock.calls;
        expect(startCalls.length).toBe(1);
        const callbacks = startCalls[0][0];

        // Now call done
        callbacks.done(null, {});

        // After done, activeRuns should be empty for this requestId.
        // If we try to cancel now, it should return false.
        const cancelled = cancelRequest(requestId);
        expect(cancelled).toBe(false);

        await promise;
    });
});
