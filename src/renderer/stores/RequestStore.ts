import { makeAutoObservable, runInAction, autorun } from 'mobx';

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

export class RequestTab {
  id: string;
  name: string = 'New Request';

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

  constructor(id: string) {
      this.id = id;
      makeAutoObservable(this, {}, { autoBind: true });
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

    if (newHeaders.length === 0 || (newHeaders[newHeaders.length - 1].key || newHeaders[newHeaders.length - 1].value)) {
       newHeaders.push({ key: '', value: '' });
    }

    this.headers = newHeaders;
  }

  private updateAuthHeader() {
    let newHeaders = this.headers.filter(h => h.key.toLowerCase() !== 'authorization');

    if (this.auth.type === 'basic') {
      const token = btoa(`${this.auth.username || ''}:${this.auth.password || ''}`);
      newHeaders.unshift({ key: 'Authorization', value: `Basic ${token}` });
    } else if (this.auth.type === 'bearer') {
      newHeaders.unshift({ key: 'Authorization', value: `Bearer ${this.auth.token || ''}` });
    }

    if (newHeaders.length === 0 || (newHeaders[newHeaders.length - 1].key || newHeaders[newHeaders.length - 1].value)) {
       newHeaders.push({ key: '', value: '' });
    }

    this.headers = newHeaders;
  }

  private parseQueryParams() {
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

    try {
        const params = new URLSearchParams(searchPart);
        const newParams: QueryParam[] = [];
        params.forEach((value, key) => {
            newParams.push({ key, value });
        });

        newParams.push({ key: '', value: '' });

        this.queryParams = newParams;
    } catch (e) {
        console.error("Failed to parse query params", e);
        // Fallback to empty if failed
        if (this.queryParams.length === 0) {
             this.queryParams = [{ key: '', value: '' }];
        }
    }
  }

  private updateUrlFromParams() {
      const validParams = this.queryParams.filter(p => p.key || p.value);

      const queryIndex = this.url.indexOf('?');
      let baseUrl = this.url;
      if (queryIndex !== -1) {
          baseUrl = this.url.substring(0, queryIndex);
      }

      if (validParams.length === 0) {
          this.url = baseUrl;
          return;
      }

      try {
          const searchParams = new URLSearchParams();
          validParams.forEach(p => {
              if (p.key) searchParams.append(p.key, p.value);
          });

          const queryString = searchParams.toString();
          this.url = `${baseUrl}?${queryString}`;
      } catch (e) {
          console.error("Failed to update url from params", e);
      }
  }
}

export class RequestStore {
  // Tabs State
  tabs: RequestTab[] = [];
  activeTabId: string | null = null;

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
    this.loadTabs();

    if (this.tabs.length === 0) {
        this.addTab();
    }

    // Auto-save tabs on change
    autorun(() => {
        this.saveTabs();
    });
  }

  // Tab Management
  addTab() {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const newTab = new RequestTab(id);
      this.tabs.push(newTab);
      this.setActiveTab(id);
  }

  closeTab(id: string) {
      if (this.tabs.length === 1) return; // Don't close last tab

      const index = this.tabs.findIndex(t => t.id === id);
      if (index === -1) return;

      this.tabs = this.tabs.filter(t => t.id !== id);

      // If we closed the active tab, switch to another
      if (this.activeTabId === id) {
          const newIndex = index === 0 ? 0 : index - 1;
          this.activeTabId = this.tabs[newIndex].id;
      }
  }

  setActiveTab(id: string) {
      this.activeTabId = id;
  }

  saveTabs() {
      const tabsData = this.tabs.map(t => {
          // Serialize only necessary state
          return {
              id: t.id,
              name: t.name,
              method: t.method,
              url: t.url,
              headers: t.headers,
              queryParams: t.queryParams,
              body: t.body,
              bodyFormData: t.bodyFormData,
              bodyUrlEncoded: t.bodyUrlEncoded,
              bodyType: t.bodyType,
              auth: t.auth,
              preRequestScript: t.preRequestScript,
              testScript: t.testScript
              // Don't save response or loading state usually
          };
      });
      localStorage.setItem('requestTabs', JSON.stringify(tabsData));
      if (this.activeTabId) {
          localStorage.setItem('activeTabId', this.activeTabId);
      }
  }

  loadTabs() {
      const savedTabs = localStorage.getItem('requestTabs');
      if (savedTabs) {
          try {
              const parsed = JSON.parse(savedTabs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  this.tabs = parsed.map((t: any) => {
                      const tab = new RequestTab(t.id);
                      // Restore state
                      if (t.method) tab.setMethod(t.method);
                      if (t.url) tab.setUrl(t.url);
                      if (t.headers) tab.setHeaders(t.headers);
                      if (t.queryParams) tab.setQueryParams(t.queryParams);
                      if (t.body) tab.setBody(t.body);
                      if (t.bodyFormData) tab.setBodyFormData(t.bodyFormData);
                      if (t.bodyUrlEncoded) tab.setBodyUrlEncoded(t.bodyUrlEncoded);
                      if (t.bodyType) tab.setBodyType(t.bodyType);
                      if (t.auth) tab.setAuth(t.auth);
                      if (t.preRequestScript) tab.setPreRequestScript(t.preRequestScript);
                      if (t.testScript) tab.setTestScript(t.testScript);
                      tab.name = t.name || 'New Request';
                      return tab;
                  });
              }
          } catch (e) {
              console.error("Failed to load tabs", e);
          }
      }

      const savedActiveId = localStorage.getItem('activeTabId');
      if (savedActiveId && this.tabs.find(t => t.id === savedActiveId)) {
          this.activeTabId = savedActiveId;
      } else if (this.tabs.length > 0) {
          this.activeTabId = this.tabs[0].id;
      }
  }

  get activeTab(): RequestTab {
      return this.tabs.find(t => t.id === this.activeTabId) || this.tabs[0];
  }

  // Proxies for backward compatibility and ease of use in components
  get method() { return this.activeTab.method; }
  set method(val: string) { this.activeTab.setMethod(val); }

  get url() { return this.activeTab.url; }
  set url(val: string) { this.activeTab.setUrl(val); }

  get headers() { return this.activeTab.headers; }
  set headers(val: Header[]) { this.activeTab.setHeaders(val); }

  get queryParams() { return this.activeTab.queryParams; }
  set queryParams(val: QueryParam[]) { this.activeTab.setQueryParams(val); }

  get body() { return this.activeTab.body; }
  set body(val: string) { this.activeTab.setBody(val); }

  get bodyFormData() { return this.activeTab.bodyFormData; }
  set bodyFormData(val: BodyItem[]) { this.activeTab.setBodyFormData(val); }

  get bodyUrlEncoded() { return this.activeTab.bodyUrlEncoded; }
  set bodyUrlEncoded(val: BodyItem[]) { this.activeTab.setBodyUrlEncoded(val); }

  get bodyType() { return this.activeTab.bodyType; }
  set bodyType(val: BodyType) { this.activeTab.setBodyType(val); }

  get auth() { return this.activeTab.auth; }
  set auth(val: Auth) { this.activeTab.setAuth(val); }

  get preRequestScript() { return this.activeTab.preRequestScript; }
  set preRequestScript(val: string) { this.activeTab.setPreRequestScript(val); }

  get testScript() { return this.activeTab.testScript; }
  set testScript(val: string) { this.activeTab.setTestScript(val); }

  get response() { return this.activeTab.response; }
  // Response is usually read-only from outside, but tests might set it
  set response(val: any) { runInAction(() => { this.activeTab.response = val; }); }

  get loading() { return this.activeTab.loading; }
  set loading(val: boolean) { runInAction(() => { this.activeTab.loading = val; }); }

  get error() { return this.activeTab.error; }
  set error(val: any) { runInAction(() => { this.activeTab.error = val; }); }

  get responseMetrics() { return this.activeTab.responseMetrics; }
  set responseMetrics(val: { time: number; size: string }) { runInAction(() => { this.activeTab.responseMetrics = val; }); }

  // Keep explicit setters for components that might use them (or if I want to deprecate them later)
  setMethod(val: string) { this.method = val; }
  setUrl(val: string) { this.url = val; }
  setHeaders(val: Header[]) { this.headers = val; }
  setQueryParams(val: QueryParam[]) { this.queryParams = val; }
  setBody(val: string) { this.body = val; }
  setBodyFormData(val: BodyItem[]) { this.bodyFormData = val; }
  setBodyUrlEncoded(val: BodyItem[]) { this.bodyUrlEncoded = val; }
  setBodyType(val: BodyType) { this.bodyType = val; }
  setPreRequestScript(val: string) { this.preRequestScript = val; }
  setTestScript(val: string) { this.testScript = val; }
  setAuth(val: Auth) { this.auth = val; }

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
    // When loading history, update the ACTIVE tab
    this.setMethod(item.method);
    this.setUrl(item.url);

    if (item.headers && item.headers.length > 0) {
      this.setHeaders([...item.headers, { key: '', value: '' }]);
    } else {
      this.setHeaders([{ key: '', value: '' }]);
    }

    this.setBody(item.body || '');
    this.setBodyType(item.bodyType || 'text');
    this.setBodyFormData(item.bodyFormData || [{ key: '', value: '', type: 'text' }]);
    this.setBodyUrlEncoded(item.bodyUrlEncoded || [{ key: '', value: '' }]);
    this.setAuth(item.auth || { type: 'none' });
    this.setPreRequestScript(item.preRequestScript || '');
    this.setTestScript(item.testScript || '');
  }

  async sendRequest() {
    const tab = this.activeTab;

    if (!tab.url) {
      alert('Please enter a URL');
      return;
    }

    runInAction(() => {
        tab.loading = true;
        tab.response = null;
        tab.error = null;
        tab.responseMetrics = { time: 0, size: '0 B' };
    });

    this.addToHistory();

    const startTime = performance.now();

    try {
      let finalUrl = tab.url;
      const validHeaders = tab.headers.filter(h => h.key.trim() !== '');

      // Handle API Key
      if (tab.auth.type === 'apikey' && tab.auth.apiKey) {
          if (tab.auth.apiKey.addTo === 'header') {
              validHeaders.push({ key: tab.auth.apiKey.key, value: tab.auth.apiKey.value });
          } else if (tab.auth.apiKey.addTo === 'query') {
              const separator = finalUrl.includes('?') ? '&' : '?';
              finalUrl = `${finalUrl}${separator}${tab.auth.apiKey.key}=${encodeURIComponent(tab.auth.apiKey.value)}`;
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
        method: tab.method,
        headers: validHeaders,
        body: tab.body,
        bodyFormData: tab.bodyFormData.filter(i => i.key),
        bodyUrlEncoded: tab.bodyUrlEncoded.filter(i => i.key),
        bodyType: tab.bodyType,
        preRequestScript: tab.preRequestScript,
        testScript: tab.testScript,
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
        tab.response = result;
        tab.loading = false;
        tab.responseMetrics = {
            time: duration,
            size: sizeStr
        };
      });
    } catch (err: any) {
      console.error(err);
      runInAction(() => {
        tab.response = {
          status: 0,
          statusText: 'Error',
          data: err.message,
          headers: {}
        };
        tab.loading = false;
      });
    }
  }
}

export const requestStore = new RequestStore();
