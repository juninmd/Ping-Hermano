/**
 * Minimal Postman-style script sandbox (`pm` API) for pre-request and test scripts.
 * Scripts are authored by the user and run locally inside a Function scope.
 */
export interface TestResult { name: string; passed: boolean; error: string | null }
export interface ConsoleEntry { level: string; messages: string[] }
export interface ScriptResponse { code: number; status: string; headers: Record<string, string>; text: string }

export interface ScriptOutput {
  environment: Record<string, string>;
  tests: TestResult[];
  logs: ConsoleEntry[];
  error?: string;
}

const fmt = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

function makeExpect(actual: any) {
  const check = (ok: boolean, msg: string) => { if (!ok) throw new Error(msg); };
  const api: any = {
    to: {
      equal: (e: any) => check(actual === e, `expected ${fmt(actual)} to equal ${fmt(e)}`),
      eql: (e: any) => check(JSON.stringify(actual) === JSON.stringify(e), `expected ${fmt(actual)} to deeply equal ${fmt(e)}`),
      include: (e: any) => check(actual?.includes?.(e), `expected ${fmt(actual)} to include ${fmt(e)}`),
      have: {
        property: (k: string) => check(actual != null && k in Object(actual), `expected object to have property ${k}`),
        length: (n: number) => check(actual?.length === n, `expected length ${actual?.length} to equal ${n}`),
      },
      be: {
        get ok() { check(!!actual, `expected ${fmt(actual)} to be truthy`); return true; },
        get true() { check(actual === true, `expected ${fmt(actual)} to be true`); return true; },
        get false() { check(actual === false, `expected ${fmt(actual)} to be false`); return true; },
        above: (n: number) => check(actual > n, `expected ${actual} to be above ${n}`),
        below: (n: number) => check(actual < n, `expected ${actual} to be below ${n}`),
      },
    },
  };
  return api;
}

/** Runs a script against the given environment/response; never throws. */
export function runScript(
  script: string | undefined,
  environment: Record<string, string>,
  response?: ScriptResponse,
): ScriptOutput {
  const out: ScriptOutput = { environment: { ...environment }, tests: [], logs: [] };
  if (!script || !script.trim()) return out;

  const log = (level: string) => (...m: unknown[]) => out.logs.push({ level, messages: m.map(x => String(x)) });
  const pm = {
    environment: {
      get: (k: string) => out.environment[k],
      set: (k: string, v: unknown) => { out.environment[k] = String(v); },
      unset: (k: string) => { delete out.environment[k]; },
    },
    response: response && {
      code: response.code,
      status: response.status,
      headers: response.headers,
      text: () => response.text,
      json: () => JSON.parse(response.text),
    },
    expect: makeExpect,
    test: (name: string, fn: () => void) => {
      try { fn(); out.tests.push({ name, passed: true, error: null }); }
      catch (e: any) { out.tests.push({ name, passed: false, error: e?.message ?? String(e) }); }
    },
  };
  const con = { log: log('log'), info: log('info'), warn: log('warn'), error: log('error') };

  try {
    new Function('pm', 'console', script)(pm, con);
  } catch (e: any) {
    out.error = e?.message ?? String(e);
    out.logs.push({ level: 'error', messages: [out.error!] });
  }
  return out;
}
