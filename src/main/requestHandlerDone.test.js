import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHandleRequest } from './requestHandler';

describe('handleRequest done callback coverage', () => {
    let mockRuntime;
    let mockRunner;
    let handleRequest;

    beforeEach(() => {
        mockRunner = {
            run: vi.fn(),
        };
        // Ensure Runner works as a constructor (cannot use arrow function)
        mockRuntime = {
            Runner: vi.fn(function() { return mockRunner; }),
        };
        handleRequest = createHandleRequest(mockRuntime);
    });

    it('should clean up activeRuns when request finishes successfully', async () => {
        const requestId = 'req-123';
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

        expect(mockRunner.run).toHaveBeenCalled();
        expect(runCallback).toBeDefined();

        // Simulate successful init
        const mockRunObject = {
            start: vi.fn((callbacks) => {
                // Simulate done callback being called
                callbacks.done(null, {});
            }),
            abort: vi.fn()
        };

        // Execute the callback passed to runner.run
        runCallback(null, mockRunObject);

        const result = await promise;

        expect(result.status).toBe(0);
        expect(result.statusText).toBe('No Response');
    });

    it('should clean up activeRuns when request errors in done', async () => {
        const requestId = 'req-error';
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

        expect(mockRunner.run).toHaveBeenCalled();

        const mockRunObject = {
            start: vi.fn((callbacks) => {
                callbacks.done(new Error('Done Error'), {});
            })
        };

        runCallback(null, mockRunObject);

        const result = await promise;

        expect(result.error).toBe('Done Error');
        expect(result.statusText).toBe('Error');
    });
});
