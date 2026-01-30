export interface IElectronAPI {
  makeRequest: (data: any) => Promise<any>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  getFilePath: (file: File) => string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
