import { makeAutoObservable, runInAction } from 'mobx';

export interface Header {
  key: string;
  value: string;
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  date: string;
}

export class RequestStore {
  // Request State
  method: string = 'GET';
  url: string = '';
  headers: Header[] = [{ key: '', value: '' }];
  body: string = '';

  // Response State
  response: any = null;
  loading: boolean = false;
  error: any = null;

  // History State
  history: HistoryItem[] = [];

  constructor() {
    makeAutoObservable(this);
    this.loadHistory();
  }

  setMethod(method: string) {
    this.method = method;
  }

  setUrl(url: string) {
    this.url = url;
  }

  setHeaders(headers: Header[]) {
    this.headers = headers;
  }

  setBody(body: string) {
    this.body = body;
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
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      method: this.method,
      url: this.url,
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
    this.url = item.url;
  }

  async sendRequest() {
    if (!this.url) {
      alert('Please enter a URL');
      return;
    }

    this.loading = true;
    this.response = null;
    this.error = null;

    this.addToHistory();

    try {
      const validHeaders = this.headers.filter(h => h.key.trim() !== '');

      const result = await window.electronAPI.makeRequest({
        url: this.url,
        method: this.method,
        headers: validHeaders,
        body: this.body
      });

      runInAction(() => {
        this.response = result;
        this.loading = false;
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
