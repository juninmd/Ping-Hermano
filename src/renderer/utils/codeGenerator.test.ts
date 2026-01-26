import { describe, it, expect } from 'vitest';
import { generateCurl, generateFetch, RequestData } from './codeGenerator';

const baseRequest: RequestData = {
    method: 'GET',
    url: 'http://example.com',
    headers: [],
    bodyType: 'text',
    body: '',
    bodyFormData: [],
    bodyUrlEncoded: [],
    queryParams: []
};

describe('generateCurl', () => {
    it('should generate basic GET curl', () => {
        const code = generateCurl(baseRequest);
        expect(code).toBe('curl -X GET "http://example.com"');
    });

    it('should include headers', () => {
        const req = { ...baseRequest, headers: [{ key: 'Accept', value: 'application/json' }] };
        const code = generateCurl(req);
        expect(code).toContain('-H "Accept: application/json"');
    });

    it('should skip headers with empty key', () => {
        const req = { ...baseRequest, headers: [{ key: '', value: 'val' }] };
        const code = generateCurl(req);
        expect(code).not.toContain('-H');
    });

    it('should skip headers with empty value', () => {
        const req = { ...baseRequest, headers: [{ key: 'Accept', value: '' }] };
        const code = generateCurl(req);
        expect(code).not.toContain('-H');
    });

    it('should include json body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'json',
            body: '{"foo":"bar"}'
        };
        const code = generateCurl(req);
        expect(code).toContain('-d \'{"foo":"bar"}\'');
    });

    it('should escape single quotes in body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'text',
            body: "It's a test"
        };
        const code = generateCurl(req);
        // It's a test -> It'\''s a test
        expect(code).toContain("-d 'It'\\''s a test'");
    });

    it('should include urlencoded body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'x-www-form-urlencoded',
            bodyUrlEncoded: [{ key: 'foo', value: 'bar' }]
        };
        const code = generateCurl(req);
        expect(code).toContain('--data-urlencode "foo=bar"');
    });

    it('should skip urlencoded items with empty key', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'x-www-form-urlencoded',
            bodyUrlEncoded: [{ key: '', value: 'bar' }]
        };
        const code = generateCurl(req);
        expect(code).not.toContain('--data-urlencode');
    });

    it('should include urlencoded items with empty value', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'x-www-form-urlencoded',
            bodyUrlEncoded: [{ key: 'foo', value: '' }]
        };
        const code = generateCurl(req);
        expect(code).toContain('--data-urlencode "foo="');
    });

    it('should include form-data body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'form-data',
            bodyFormData: [{ key: 'file', value: 'data', type: 'text' }]
        };
        const code = generateCurl(req);
        expect(code).toContain('-F "file=data"');
    });

    it('should skip form-data items with empty key', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'form-data',
            bodyFormData: [{ key: '', value: 'data', type: 'text' }]
        };
        const code = generateCurl(req);
        expect(code).not.toContain('-F');
    });

    it('should include form-data items with empty value', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'form-data',
            bodyFormData: [{ key: 'file', value: '', type: 'text' }]
        };
        const code = generateCurl(req);
        expect(code).toContain('-F "file="');
    });
});

describe('generateFetch', () => {
    it('should generate basic GET fetch', () => {
        const code = generateFetch(baseRequest);
        expect(code).toContain('fetch("http://example.com"');
        expect(code).toContain('method: "GET"');
    });

    it('should include headers', () => {
        const req = { ...baseRequest, headers: [{ key: 'Accept', value: 'application/json' }] };
        const code = generateFetch(req);
        expect(code).toContain('"Accept": "application/json"');
    });

    it('should skip headers with empty value', () => {
         const req = { ...baseRequest, headers: [{ key: 'Accept', value: '' }] };
         const code = generateFetch(req);
         expect(code).not.toContain('"Accept"');
    });

    it('should format json body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'json',
            body: '{"foo":"bar"}'
        };
        const code = generateFetch(req);
        expect(code).toContain('body: JSON.stringify(');
        expect(code).toContain('"foo": "bar"');
    });

    it('should handle raw body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'text',
            body: 'raw data'
        };
        const code = generateFetch(req);
        expect(code).toContain('body: "raw data"');
    });

    it('should handle urlencoded body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'x-www-form-urlencoded',
            bodyUrlEncoded: [{ key: 'foo', value: 'bar' }]
        };
        const code = generateFetch(req);
        expect(code).toContain('body: new URLSearchParams(');
        expect(code).toContain('["foo","bar"]');
    });

    it('should skip urlencoded items with empty key', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'x-www-form-urlencoded',
            bodyUrlEncoded: [{ key: '', value: 'bar' }]
        };
        const code = generateFetch(req);
        expect(code).not.toContain('body: new URLSearchParams');
    });

    it('should handle form-data body', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'form-data',
            bodyFormData: [{ key: 'foo', value: 'bar', type: 'text' }]
        };
        const code = generateFetch(req);
        expect(code).toContain('const formdata = new FormData();');
        expect(code).toContain('formdata.append("foo", "bar")');
        expect(code).toContain('body: formdata');
    });

     it('should skip form-data items with empty key', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'form-data',
            bodyFormData: [{ key: '', value: 'bar', type: 'text' }]
        };
        const code = generateFetch(req);
        // No formdata preamble
        expect(code).not.toContain('new FormData()');
        expect(code).not.toContain('body: formdata');
    });

    it('should handle invalid json body fallback to string', () => {
        const req: RequestData = {
            ...baseRequest,
            method: 'POST',
            bodyType: 'json',
            body: '{invalid}'
        };
        const code = generateFetch(req);
        // Should fall back to assigning body as string directly without parsing
        expect(code).toContain('body: "{invalid}"');
    });
});
