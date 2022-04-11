import { IClusterAuth } from 'src/cluster-manager';
import { ICluster } from 'src/cluster-manager';
import { onAADConfigurationsChange, onClusterListChange} from '../preload';

declare global {
    interface Window {
        electronInterop: electronInterop
    }
  }
  
  export type HttpMethod =
      'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' |
      'HEAD' | 'CONNECT' | 'OPTIONS' | 'TRACE';
  
  interface IHttpHeader {
      name: string;
      value: string;
  }
  
  export interface IHttpResponse {
      httpVersion: string;
      statusCode: number;
      statusMessage: string;
  
      data: any;
  
      headers: Array<IHttpHeader>;
      body: Array<number>;
  }
  
  export interface IHttpRequest {
      method: HttpMethod;
      url: string;
      headers?: Array<IHttpHeader>;
      body?: any;
  }
  

  export interface IWindowInfo {
      name: string;
      url: string;
      id: string;
  }


  export interface electronInterop {
    sendHttpRequest(request: IHttpRequest): Promise<IHttpResponse>;

    addCluster(cluster: ICluster): Promise<any>;
    removeCluster(cluster: ICluster): Promise<any>;
    editCluster(cluster: ICluster): Promise<any>; //TODO
    connectCluster(cluster: ICluster): Promise<any>;
    reconnectCluster(cluster: ICluster): Promise<any>;
    disconnectCluster(cluster: ICluster): Promise<any>;
    clearClusterLog(cluster: ICluster): Promise<any>;
    bulkImportCluster(cluster: ICluster[]): Promise<any>;

    validateAuthConfiguration(auth: IClusterAuth): Promise<string[]>;

    requestClusterState();
    onClusterListChange(callback: onClusterListChange);
    
    requestAADState();
    onAADConfigurationsChange(callback: onAADConfigurationsChange);
    logoutOfAad(tenant: string): Promise<any>;

    requestFileDialog(data: any): Promise<any>;
}

