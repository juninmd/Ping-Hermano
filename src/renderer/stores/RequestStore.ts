import { makeAutoObservable, runInAction } from 'mobx';

export interface Header {
  key: string;
  value: string;
}

export interface QueryParam {
  key: string;
  value: string;
}

export interface Auth {
  type: 'none' | 'basic' | 'bearer' | 'apikey';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: { key: string, value: string, addTo: 'header' | 'query' };
}

export type BodyType = 'text' | 'json' | 'form-data' | 'x-www-form-urlencoded';

export interface BodyItem {
  key: string;
  value: string;
  type?: 'text' | 'file';
  src?: string;
}

export interface HistoryItem {
  id: string;
  name?: string;
  method: string;
  url: string;
  headers?: Header[];
  body?: string;
  bodyFormData?: BodyItem[];
  bodyUrlEncoded?: BodyItem[];
  bodyType?: BodyType;
  auth?: Auth;
  preRequestScript?: string;
  testScript?: string;
  date: string;
}

export interface Collection {
  id: string;
  name: string;
  requests: HistoryItem[]; // Reuse HistoryItem structure
}

export interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: Variable[];
}

export class RequestStore {
  // Request State
  method: string = 'GET';
  url: string = '';
  headers: Header[] = [{ key: '', value: '' }];
  queryParams: QueryParam[] = [{ key: '', value: '' }];
  body: string = '';
  bodyFormData: BodyItem[] = [{ key: '', value: '', type: 'text' }];
  bodyUrlEncoded: BodyItem[] = [{ key: '', value: '' }];
  bodyType: BodyType = 'text';
  auth: Auth = { type: 'none' };
  preRequestScript: string = '';
  testScript: string = '';

  // Response State
  response: any = null;
  loading: boolean = false;
  error: any = null;
  responseMetrics: { time: number; size: string } = { time: 0, size: '0 B' };

  // History State
  history: HistoryItem[] = [];
  collections: Collection[] = [];

  // Environment State
  environments: Environment[] = [];
  activeEnvironmentId: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadHistory();
    this.loadCollections();
    this.loadEnvironments();
  }

  setMethod(method: string) {
    this.method = method;
  }

  setUrl(url: string) {
    this.url = url;
    this.parseQueryParams();
  }

  setHeaders(headers: Header[]) {
    this.headers = headers;
  }

  setQueryParams(params: QueryParam[]) {
    this.queryParams = params;
    this.updateUrlFromParams();
  }

  setBody(body: string) {
    this.body = body;
  }

  setBodyFormData(data: BodyItem[]) {
      this.bodyFormData = data;
  }

  setBodyUrlEncoded(data: BodyItem[]) {
      this.bodyUrlEncoded = data;
  }

  setBodyType(type: BodyType) {
    this.bodyType = type;
    this.updateContentTypeHeader();
  }

  setPreRequestScript(script: string) {
    this.preRequestScript = script;
  }

  setTestScript(script: string) {
    this.testScript = script;
  }

  setAuth(auth: Auth) {
    this.auth = auth;
    this.updateAuthHeader();
  }

  private updateContentTypeHeader() {
    let newHeaders = this.headers.filter(h => h.key.toLowerCase() !== 'content-type');

    if (this.bodyType === 'json') {
      newHeaders.unshift({ key: 'Content-Type', value: 'application/json' });
    } else if (this.bodyType === 'x-www-form-urlencoded') {
        newHeaders.unshift({ key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
    }
    // For form-data, we usually let the runtime set it including boundary, but usually user expects to see it?
    // Postman runtime handles it. If we set multipart/form-data manually, we must not set boundary manually usually.
    // Let's leave it out for form-data so runtime sets it with boundary.

    // If text, we don't force a header, or we could remove it (which we did by filtering).
    // This allows user to manually set it if they want something else, but if they switch to JSON, we force it.

    // Ensure empty row at end if needed
    if (newHeaders.length === 0 || (newHeaders[newHeaders.length - 1].key || newHeaders[newHeaders.length - 1].value)) {
       newHeaders.push({ key: '', value: '' });
    }

    this.headers = newHeaders;
  }

  private updateAuthHeader() {
    // Remove existing Authorization header
    let newHeaders = this.headers.filter(h => h.key.toLowerCase() !== 'authorization');

    if (this.auth.type === 'basic') {
      const token = btoa(`${this.auth.username || ''}:${this.auth.password || ''}`);
      newHeaders.unshift({ key: 'Authorization', value: `Basic ${token}` });
    } else if (this.auth.type === 'bearer') {
      newHeaders.unshift({ key: 'Authorization', value: `Bearer ${this.auth.token || ''}` });
    }

    // Ensure empty row at end if needed
    if (newHeaders.length === 0 || (newHeaders[newHeaders.length - 1].key || newHeaders[newHeaders.length - 1].value)) {
       newHeaders.push({ key: '', value: '' });
    }

    this.headers = newHeaders;
  }

  private parseQueryParams() {
    try {
        let searchPart = '';
        const queryIndex = this.url.indexOf('?');
        if (queryIndex !== -1) {
            searchPart = this.url.substring(queryIndex + 1);
        }

        if (!searchPart) {
           if (this.queryParams.length > 1 || (this.queryParams[0].key || this.queryParams[0].value)) {
               this.queryParams = [{ key: '', value: '' }];
           }
           return;
        }

        const params = new URLSearchParams(searchPart);
        const newParams: QueryParam[] = [];
        params.forEach((value, key) => {
            newParams.push({ key, value });
        });

        // Always add an empty row at the end
        newParams.push({ key: '', value: '' });

        this.queryParams = newParams;
    } catch (e) {
        // Ignore parsing errors
    }
  }

  private updateUrlFromParams() {
      const validParams = this.queryParams.filter(p => p.key || p.value);

      // Get base URL (remove query string)
      const queryIndex = this.url.indexOf('?');
      let baseUrl = this.url;
      if (queryIndex !== -1) {
          baseUrl = this.url.substring(0, queryIndex);
      }

      if (validParams.length === 0) {
          this.url = baseUrl;
          return;
      }

      const searchParams = new URLSearchParams();
      validParams.forEach(p => {
          if (p.key) searchParams.append(p.key, p.value);
      });

      const queryString = searchParams.toString();
      this.url = `${baseUrl}?${queryString}`;
  }

  loadHistory() {
    const savedHistory = localStorage.getItem('requestHistory');
    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }

  saveHistory() {
    localStorage.setItem('requestHistory', JSON.stringify(this.history));
  }

  loadCollections() {
    const savedCollections = localStorage.getItem('requestCollections');
    if (savedCollections) {
      try {
        this.collections = JSON.parse(savedCollections);
      } catch (e) {
        console.error("Failed to parse collections", e);
      }
    }
  }

  saveCollections() {
    localStorage.setItem('requestCollections', JSON.stringify(this.collections));
  }

  loadEnvironments() {
    const savedEnvs = localStorage.getItem('environments');
    if (savedEnvs) {
      try {
        this.environments = JSON.parse(savedEnvs);
      } catch (e) {
        console.error("Failed to parse environments", e);
      }
    }
    const savedActiveEnvId = localStorage.getItem('activeEnvironmentId');
    if (savedActiveEnvId) {
        this.activeEnvironmentId = savedActiveEnvId;
    }
  }

  saveEnvironments() {
    localStorage.setItem('environments', JSON.stringify(this.environments));
    if (this.activeEnvironmentId) {
        localStorage.setItem('activeEnvironmentId', this.activeEnvironmentId);
    } else {
        localStorage.removeItem('activeEnvironmentId');
    }
  }

  createEnvironment(name: string) {
    const newEnv: Environment = {
      id: Date.now().toString(),
      name,
      variables: [{ key: '', value: '', enabled: true }]
    };
    this.environments.push(newEnv);
    this.saveEnvironments();
    if (!this.activeEnvironmentId) {
        this.setActiveEnvironment(newEnv.id);
    }
  }

  deleteEnvironment(id: string) {
    this.environments = this.environments.filter(e => e.id !== id);
    if (this.activeEnvironmentId === id) {
        this.activeEnvironmentId = null;
    }
    this.saveEnvironments();
  }

  updateEnvironment(id: string, name: string, variables: Variable[]) {
      const env = this.environments.find(e => e.id === id);
      if (env) {
          env.name = name;
          env.variables = variables;
          this.saveEnvironments();
      }
  }

  setActiveEnvironment(id: string | null) {
      this.activeEnvironmentId = id;
      this.saveEnvironments();
  }

  createCollection(name: string) {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      requests: []
    };
    this.collections.push(newCollection);
    this.saveCollections();
  }

  deleteCollection(id: string) {
    this.collections = this.collections.filter(c => c.id !== id);
    this.saveCollections();
  }

  exportCollections() {
    return JSON.stringify(this.collections, null, 2);
  }

  importCollections(jsonStr: string) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
          // Regenerate IDs to avoid conflicts
          const newCollections = parsed.map((col: any) => ({
              ...col,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              requests: (col.requests || []).map((req: any) => ({
                  ...req,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
              }))
          }));
          this.collections.push(...newCollections);
          this.saveCollections();
          return true;
      }
    } catch (e) {
      console.error("Failed to import collections", e);
    }
    return false;
  }

  exportEnvironments() {
    return JSON.stringify(this.environments, null, 2);
  }

  importEnvironments(jsonStr: string) {
      try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
              const newEnvs = parsed.map((env: any) => ({
                  ...env,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
              }));
              this.environments.push(...newEnvs);
              this.saveEnvironments();
              return true;
          }
      } catch (e) {
          console.error("Failed to import environments", e);
      }
      return false;
  }

  saveRequestToCollection(collectionId: string, name: string) {
      const validHeaders = this.headers.filter(h => h.key.trim() !== '' || h.value.trim() !== '');
      const newRequest: HistoryItem = {
          id: Date.now().toString(),
          name: name,
          method: this.method,
          url: this.url,
          headers: validHeaders,
          body: this.body,
          bodyFormData: this.bodyFormData,
          bodyUrlEncoded: this.bodyUrlEncoded,
          bodyType: this.bodyType,
          auth: this.auth,
          preRequestScript: this.preRequestScript,
          testScript: this.testScript,
          date: new Date().toISOString()
      };

      const collection = this.collections.find(c => c.id === collectionId);
      if (collection) {
          collection.requests.push(newRequest);
          this.saveCollections();
      }
  }

  deleteRequestFromCollection(collectionId: string, requestId: string) {
      const collection = this.collections.find(c => c.id === collectionId);
      if (collection) {
          collection.requests = collection.requests.filter(r => r.id !== requestId);
          this.saveCollections();
      }
  }

  addToHistory() {
    const validHeaders = this.headers.filter(h => h.key.trim() !== '' || h.value.trim() !== '');

    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      method: this.method,
      url: this.url,
      headers: validHeaders,
      body: this.body,
      bodyFormData: this.bodyFormData,
      bodyUrlEncoded: this.bodyUrlEncoded,
      bodyType: this.bodyType,
      auth: this.auth,
      preRequestScript: this.preRequestScript,
      testScript: this.testScript,
      date: new Date().toISOString()
    };

    const filtered = this.history.filter(item => !(item.method === this.method && item.url === this.url));
    this.history = [newHistoryItem, ...filtered].slice(0, 50);
    this.saveHistory();
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  loadHistoryItem(item: HistoryItem) {
    this.method = item.method;
    this.setUrl(item.url);

    if (item.headers && item.headers.length > 0) {
      this.headers = [...item.headers, { key: '', value: '' }];
    } else {
      this.headers = [{ key: '', value: '' }];
    }

    this.body = item.body || '';
    this.bodyType = item.bodyType || 'text';
    this.bodyFormData = item.bodyFormData || [{ key: '', value: '', type: 'text' }];
    this.bodyUrlEncoded = item.bodyUrlEncoded || [{ key: '', value: '' }];
    this.auth = item.auth || { type: 'none' };
    this.preRequestScript = item.preRequestScript || '';
    this.testScript = item.testScript || '';
  }

  async sendRequest() {
    if (!this.url) {
      alert('Please enter a URL');
      return;
    }

    this.loading = true;
    this.response = null;
    this.error = null;
    this.responseMetrics = { time: 0, size: '0 B' };

    this.addToHistory();

    const startTime = performance.now();

    try {
      let finalUrl = this.url;
      const validHeaders = this.headers.filter(h => h.key.trim() !== '');

      // Handle API Key
      if (this.auth.type === 'apikey' && this.auth.apiKey) {
          if (this.auth.apiKey.addTo === 'header') {
              validHeaders.push({ key: this.auth.apiKey.key, value: this.auth.apiKey.value });
          } else if (this.auth.apiKey.addTo === 'query') {
              const separator = finalUrl.includes('?') ? '&' : '?';
              finalUrl = `${finalUrl}${separator}${this.auth.apiKey.key}=${encodeURIComponent(this.auth.apiKey.value)}`;
          }
      }

      let environmentVariables: Record<string, string> = {};
      if (this.activeEnvironmentId) {
          const env = this.environments.find(e => e.id === this.activeEnvironmentId);
          if (env) {
              env.variables.forEach(v => {
                  if (v.enabled && v.key) {
                      environmentVariables[v.key] = v.value;
                  }
              });
          }
      }

      const result = await window.electronAPI.makeRequest({
        url: finalUrl,
        method: this.method,
        headers: validHeaders,
        body: this.body,
        bodyFormData: this.bodyFormData.filter(i => i.key),
        bodyUrlEncoded: this.bodyUrlEncoded.filter(i => i.key),
        bodyType: this.bodyType,
        preRequestScript: this.preRequestScript,
        testScript: this.testScript,
        environment: environmentVariables
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Calculate size approx
      let sizeBytes = 0;
      if (result.data) {
          sizeBytes = new TextEncoder().encode(typeof result.data === 'string' ? result.data : JSON.stringify(result.data)).length;
      }

      let sizeStr = `${sizeBytes} B`;
      if (sizeBytes > 1024) sizeStr = `${(sizeBytes / 1024).toFixed(2)} KB`;
      if (sizeBytes > 1024 * 1024) sizeStr = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

      runInAction(() => {
        this.response = result;
        this.loading = false;
        this.responseMetrics = {
            time: duration,
            size: sizeStr
        };
      });
    } catch (err: any) {
      console.error(err);
      runInAction(() => {
        this.response = {
          status: 0,
          statusText: 'Error',
          data: err.message,
          headers: {}
        };
        this.loading = false;
      });
    }
  }
}

export const requestStore = new RequestStore();
