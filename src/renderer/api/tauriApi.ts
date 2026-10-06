import { invoke } from '@tauri-apps/api/core';
import { runScript } from './scriptRunner';

type KV = { key: string; value: string };

/** File inputs only expose a File in the webview: keep them to read bytes at send time. */
const files = new Map<string, File>();

const interpolate = (s: string, env: Record<string, string>) =>
  typeof s === 'string' ? s.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (m, k) => (k in env ? env[k] : m)) : s;

const fail = (error: string, statusText = 'Error') =>
  ({ error, status: 0, statusText, headers: {}, data: '' });

async function makeRequest(data: any) {
  const pre = runScript(data.preRequestScript, data.environment || {});
  const env = pre.environment;
  const sub = (s: string) => interpolate(s, env);

  const formData = await Promise.all((data.bodyFormData || []).map(async (i: any) => {
    if (i.type !== 'file') return { key: sub(i.key), value: sub(i.value || ''), isFile: false };
    const f = files.get(i.src);
    return { key: sub(i.key), value: i.value || '', isFile: true, bytes: f ? Array.from(new Uint8Array(await f.arrayBuffer())) : null };
  }));

  let res: any;
  try {
    res = await invoke('make_request', {
      req: {
        requestId: data.requestId || null,
        url: sub(data.url),
        method: data.method || 'GET',
        headers: (data.headers || []).map((h: KV) => ({ key: sub(h.key), value: sub(h.value) })),
        body: data.body ? sub(data.body) : null,
        bodyType: data.bodyType || 'text',
        formData,
        urlEncoded: (data.bodyUrlEncoded || []).map((i: KV) => ({ key: sub(i.key), value: sub(i.value) })),
      },
    });
  } catch (e: any) {
    return fail(typeof e === 'string' ? e : e?.message || 'Request failed');
  }

  const text = typeof res.body === 'string' ? res.body : '';
  let body: any = text;
  if ((res.headers['content-type'] || '').includes('json')) {
    try { body = JSON.parse(text); } catch { /* keep text */ }
  }

  const post = runScript(data.testScript, env, { code: res.status, status: res.statusText, headers: res.headers, text });
  return {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    data: body,
    testResults: [...pre.tests, ...post.tests],
    consoleLogs: [...pre.logs, ...post.logs],
  };
}

/** Exposes the native bridge used by the renderer (replaces the former Electron preload). */
export function installNativeApi() {
  (window as any).pingAPI = {
    makeRequest,
    cancelRequest: (id: string) => invoke<boolean>('cancel_request', { requestId: id }),
    getFilePath: (file: File) => {
      const token = `${file.name}:${file.size}:${file.lastModified}`;
      files.set(token, file);
      return token;
    },
  };
}
