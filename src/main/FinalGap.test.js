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
            }),
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
        const requestPromise = handleRequest({ url: 'http://test.com', requestId });
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(startCallbacks).toBeDefined();
        startCallbacks.done(null, {});

        await requestPromise;
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
        handleRequest({ url: 'http://test.com', requestId });
        await new Promise(resolve => setTimeout(resolve, 0));
        const result = cancelRequest(requestId);
        expect(result).toBe(true);
    });

    it('should handle done callback with no response data and no error', async () => {
        const requestId = 'no-response-test-id';
        let startCallbacks;

        const mockRun = {
            start: vi.fn((callbacks) => {
                startCallbacks = callbacks;
            }),
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
        const requestPromise = handleRequest({ url: 'http://test.com', requestId });
        await new Promise(resolve => setTimeout(resolve, 0));

        // Trigger done WITHOUT calling request() first, so responseData is null
        // And pass no error to done()
        startCallbacks.done(null, {});

        const result = await requestPromise;

        expect(result).toEqual({
             status: 0,
             statusText: 'No Response',
             headers: {},
             data: '',
             testResults: [],
             consoleLogs: []
        });
    });
});
