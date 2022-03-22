import { ICluster } from 'src/cluster-manager';
import { AddWindowEvent } from '../mainWindow';
import { onClusterListChange} from '../preload';

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
    reconnectCluster(cluster: ICluster): Promise<any>;
    disconnectCluster(cluster: ICluster): Promise<any>;
    clearClusterLog(cluster: ICluster): Promise<any>;


    requestClusterState();
    onClusterListChange(callback: onClusterListChange);
    requestFileDialog(data: any): Promise<any>;
}

