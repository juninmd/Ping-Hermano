export interface ElectronAPI {
  makeRequest: (data: any) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
