export interface IPingAPI {
  makeRequest: (data: any) => Promise<any>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  getFilePath: (file: File) => string;
}

declare global {
  interface Window {
    pingAPI: IPingAPI;
  }
}
