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
  type: 'none' | 'basic' | 'bearer';
  username?: string;
  password?: string;
  token?: string;
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  headers?: Header[];
  body?: string;
  auth?: Auth;
  preRequestScript?: string;
  testScript?: string;
  date: string;
}

export class RequestStore {
  // Request State
  method: string = 'GET';
  url: string = '';
  headers: Header[] = [{ key: '', value: '' }];
  queryParams: QueryParam[] = [{ key: '', value: '' }];
  body: string = '';
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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadHistory();
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

  addToHistory() {
    const validHeaders = this.headers.filter(h => h.key.trim() !== '' || h.value.trim() !== '');

    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      method: this.method,
      url: this.url,
      headers: validHeaders,
      body: this.body,
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
      const validHeaders = this.headers.filter(h => h.key.trim() !== '');

      const result = await window.electronAPI.makeRequest({
        url: this.url,
        method: this.method,
        headers: validHeaders,
        body: this.body,
        preRequestScript: this.preRequestScript,
        testScript: this.testScript
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
