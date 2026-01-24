/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandleRequest } from './requestHandler';

describe('handleRequest', () => {
  let mockRun;
  let handleRequest;

  beforeEach(() => {
    mockRun = vi.fn();
    const mockRuntime = {
        Runner: vi.fn(function() {
            this.run = mockRun;
        })
    };
    handleRequest = createHandleRequest(mockRuntime);
  });

  it('should handle a successful request with JSON response', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                callbacks.request(null, null, {
                    code: 200,
                    status: 'OK',
                    headers: { each: (cb) => cb({ key: 'Content-Type', value: 'application/json' }) },
                    stream: Buffer.from(JSON.stringify({ message: 'success' }))
                }, {}, {}, {}, {});

                if (callbacks.console) callbacks.console(null, 'log', 'test log');
                if (callbacks.assertion) callbacks.assertion(null, [{ assertion: 'Status is 200', error: null }]);

                callbacks.done(null, {});
            }
        };
        callback(null, runObj);
    });

    const result = await handleRequest({
        url: 'http://example.com',
        method: 'GET',
        headers: [{ key: 'Accept', value: 'application/json' }]
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ message: 'success' });
    expect(result.consoleLogs).toEqual([{ level: 'log', messages: ['test log'] }]);
    expect(result.testResults).toEqual([{ name: 'Status is 200', passed: true, error: null }]);
  });

  it('should handle request with form-data body', async () => {
    let capturedCollection;
    mockRun.mockImplementation((collection, options, callback) => {
       capturedCollection = collection;
       const runObj = { start: (callbacks) => callbacks.done(null, {}) };
       callback(null, runObj);
    });

    await handleRequest({
        url: 'http://example.com',
        method: 'POST',
        bodyType: 'form-data',
        bodyFormData: [{ key: 'foo', value: 'bar' }]
    });

    const item = capturedCollection.items.members[0];
    expect(item.request.body.mode).toBe('formdata');
  });

  it('should handle request with urlencoded body', async () => {
    let capturedCollection;
    mockRun.mockImplementation((collection, options, callback) => {
       capturedCollection = collection;
       const runObj = { start: (callbacks) => callbacks.done(null, {}) };
       callback(null, runObj);
    });

    await handleRequest({
        url: 'http://example.com',
        method: 'POST',
        bodyType: 'x-www-form-urlencoded',
        bodyUrlEncoded: [{ key: 'foo', value: 'bar' }]
    });

    const item = capturedCollection.items.members[0];
    expect(item.request.body.mode).toBe('urlencoded');
  });

  it('should handle request with raw body', async () => {
    let capturedCollection;
    mockRun.mockImplementation((collection, options, callback) => {
       capturedCollection = collection;
       const runObj = { start: (callbacks) => callbacks.done(null, {}) };
       callback(null, runObj);
    });

    await handleRequest({
        url: 'http://example.com',
        method: 'POST',
        bodyType: 'json',
        body: '{"a":1}'
    });

    const item = capturedCollection.items.members[0];
    expect(item.request.body.mode).toBe('raw');
    expect(item.request.body.raw).toBe('{"a":1}');
  });

  it('should add pre-request and test scripts', async () => {
    let capturedCollection;
    mockRun.mockImplementation((collection, options, callback) => {
       capturedCollection = collection;
       const runObj = { start: (callbacks) => callbacks.done(null, {}) };
       callback(null, runObj);
    });

    await handleRequest({
        url: 'http://example.com',
        preRequestScript: 'console.log("pre")',
        testScript: 'console.log("test")'
    });

    const item = capturedCollection.items.members[0];
    expect(item.events.count()).toBe(2);
  });

  it('should handle runner initialization error', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        callback(new Error('Init failed'), null);
    });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.status).toBe(0);
    expect(result.error).toBe('Init failed');
  });

  it('should handle request execution error', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
           start: (callbacks) => {
               callbacks.request(new Error('Network error'), null, null, null, null, null, null);
               callbacks.done(null, {});
           }
       };
       callback(null, runObj);
   });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.status).toBe(0);
    expect(result.error).toBe('Network error');
  });

  it('should handle environment variables', async () => {
      let capturedOptions;
      mockRun.mockImplementation((collection, options, callback) => {
        capturedOptions = options;
        const runObj = { start: (callbacks) => callbacks.done(null, {}) };
        callback(null, runObj);
     });

     await handleRequest({
         url: 'http://example.com',
         environment: { foo: 'bar' }
     });

     expect(capturedOptions.environment).toBeDefined();
     expect(capturedOptions.environment.values.one('foo').value).toBe('bar');
  });

  it('should handle assertions and failures', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                callbacks.assertion(null, [
                    { assertion: 'Pass', error: null },
                    { assertion: 'Fail', error: { message: 'Failed' } }
                ]);
                callbacks.done(null, {});
            }
        };
        callback(null, runObj);
    });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.testResults.length).toBe(2);
    expect(result.testResults[0].passed).toBe(true);
    expect(result.testResults[1].passed).toBe(false);
  });

  it('should handle headers object input', async () => {
     let capturedCollection;
     mockRun.mockImplementation((collection, options, callback) => {
        capturedCollection = collection;
        const runObj = { start: (cb) => cb.done(null, {}) };
        callback(null, runObj);
     });

     await handleRequest({
         url: 'http://example.com',
         headers: { 'X-Custom': 'Value' }
     });

     const item = capturedCollection.items.members[0];
     expect(item.request.headers.count()).toBe(1);
  });

  it('should handle exceptions synchronously', async () => {
       // Re-create with throwing constructor
       const throwingRuntime = {
           Runner: vi.fn(function() {
                throw new Error('Sync error');
           })
       };
       const throwingHandler = createHandleRequest(throwingRuntime);

       const result = await throwingHandler({ url: 'http://example.com' });
       expect(result.status).toBe(0);
       expect(result.error).toBe('Sync error');
  });

  it('should ignore headers with empty keys', async () => {
    let capturedCollection;
    mockRun.mockImplementation((collection, options, callback) => {
       capturedCollection = collection;
       const runObj = { start: (cb) => cb.done(null, {}) };
       callback(null, runObj);
    });

    await handleRequest({
        url: 'http://example.com',
        headers: [{ key: '', value: 'foo' }, { key: 'valid', value: 'bar' }]
    });

    const item = capturedCollection.items.members[0];
    expect(item.request.headers.count()).toBe(1);
    expect(item.request.headers.idx(0).key).toBe('valid');
  });

  it('should handle missing assertions in callback', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                // Call assertion with null assertions list
                callbacks.assertion(null, null);
                callbacks.done(null, {});
            }
        };
        callback(null, runObj);
    });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.testResults).toEqual([]);
  });

  it('should handle response without headers', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                callbacks.request(null, null, {
                    code: 200,
                    status: 'OK',
                    // No headers property
                    stream: Buffer.from('data')
                }, {}, {}, {}, {});
                callbacks.done(null, {});
            }
        };
        callback(null, runObj);
    });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.headers).toEqual({});
  });

  it('should handle response without stream', async () => {
    mockRun.mockImplementation((collection, options, callback) => {
        const runObj = {
            start: (callbacks) => {
                callbacks.request(null, null, {
                    code: 200,
                    status: 'OK',
                    headers: { each: () => {} },
                    // stream undefined
                }, {}, {}, {}, {});
                callbacks.done(null, {});
            }
        };
        callback(null, runObj);
    });

    const result = await handleRequest({ url: 'http://example.com' });
    expect(result.data).toBe('');
  });
});
