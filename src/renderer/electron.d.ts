export interface IElectronAPI {
  makeRequest: (data: any) => Promise<any>;
  getFilePath: (file: File) => string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
