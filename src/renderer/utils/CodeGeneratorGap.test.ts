import { describe, it, expect } from 'vitest';
import * as codeGenerator from './codeGenerator';
import { BodyType } from '../stores/RequestStore';

describe('CodeGenerator Gap Tests', () => {
    it('should generate curl for POST with unhandled body type', () => {
        const reqData = {
            method: 'POST',
            url: 'http://example.com',
            headers: [],
            bodyType: 'none' as BodyType, // Or any string that falls through
            body: '',
            bodyFormData: [],
            bodyUrlEncoded: [],
            queryParams: []
        };
        const curl = codeGenerator.generateCurl(reqData);
        // Should contain method and url, but no body flags
        expect(curl).toContain('curl -X POST "http://example.com"');
        expect(curl).not.toContain('-d');
        expect(curl).not.toContain('-F');
        expect(curl).not.toContain('--data-urlencode');
    });

    it('should generate fetch for POST with unhandled body type', () => {
        const reqData = {
            method: 'POST',
            url: 'http://example.com',
            headers: [],
            bodyType: 'none' as BodyType,
            body: '',
            bodyFormData: [],
            bodyUrlEncoded: [],
            queryParams: []
        };
        const fetchCode = codeGenerator.generateFetch(reqData);
        expect(fetchCode).toContain('method: "POST"');
        expect(fetchCode).not.toContain('body:');
    });
});
