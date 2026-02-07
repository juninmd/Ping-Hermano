import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandleRequest } from './requestHandler';

describe('handleRequest Final Gap', () => {
    let mockRuntime;
    let mockRunner;
    let mockRun;

    beforeEach(() => {
        mockRun = {
            start: vi.fn(),
            abort: vi.fn(),
        };

        mockRunner = {
            run: vi.fn((collection, options, callback) => {
                // We need to defer the callback execution or just call it immediately?
                // The real runtime calls callback with (err, run).
                callback(null, mockRun);
            }),
        };

        // Important: Use a regular function so it can be called with 'new'
        mockRuntime = {
            Runner: vi.fn(function() { return mockRunner; }),
        };
    });

    it('should handle error in done callback', async () => {
        const handleRequest = createHandleRequest(mockRuntime);

        mockRun.start.mockImplementation((callbacks) => {
            // Simulate done with error
            callbacks.done(new Error('Simulated Done Error'), {});
        });

        const result = await handleRequest({
            url: 'http://test.com',
            method: 'GET',
            headers: [],
            requestId: 'req-1'
        });

        expect(result.status).toBe(0);
        expect(result.statusText).toBe('Error');
        expect(result.error).toBe('Simulated Done Error');
    });

    it('should handle errorData in done callback', async () => {
        const handleRequest = createHandleRequest(mockRuntime);

        mockRun.start.mockImplementation((callbacks) => {
            // Simulate request error first, setting errorData
            callbacks.request(new Error('Request Error'), {}, {}, {}, {}, {}, {});
            // Then done
            callbacks.done(null, {});
        });

        const result = await handleRequest({
            url: 'http://test.com',
            method: 'GET',
            headers: [],
            requestId: 'req-2'
        });

        expect(result.status).toBe(0);
        expect(result.statusText).toBe('Error');
        expect(result.error).toBe('Request Error');
    });

    it('should handle abort/unknown error in done callback (no message)', async () => {
        const handleRequest = createHandleRequest(mockRuntime);

        mockRun.start.mockImplementation((callbacks) => {
            // Simulate done with error object without message (e.g. weird runtime error)
            callbacks.done({}, {});
        });

        const result = await handleRequest({
            url: 'http://test.com',
            method: 'GET',
            headers: [],
            requestId: 'req-3'
        });

        expect(result.status).toBe(0);
        expect(result.statusText).toBe('Error');
        expect(result.error).toBe('Request Failed');
    });
});
