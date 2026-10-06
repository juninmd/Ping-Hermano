import { describe, it, expect } from 'vitest';
import { runScript } from './scriptRunner';

const res = { code: 200, status: 'OK', headers: {}, text: '{"a":1}' };

describe('runScript', () => {
  it('returns untouched env for empty script', () => {
    expect(runScript('', { a: '1' }).environment).toEqual({ a: '1' });
  });

  it('sets environment variables', () => {
    const out = runScript("pm.environment.set('t', 5)", {});
    expect(out.environment.t).toBe('5');
  });

  it('records passing and failing tests', () => {
    const out = runScript(
      "pm.test('ok',()=>pm.expect(pm.response.code).to.equal(200)); pm.test('bad',()=>pm.expect(pm.response.json().a).to.equal(2))",
      {}, res);
    expect(out.tests.map(t => t.passed)).toEqual([true, false]);
    expect(out.tests[1].error).toContain('to equal');
  });

  it('captures console output and script errors', () => {
    const out = runScript("console.log('hi'); throw new Error('boom')", {});
    expect(out.logs[0]).toEqual({ level: 'log', messages: ['hi'] });
    expect(out.error).toBe('boom');
  });
});
