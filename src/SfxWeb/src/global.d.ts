declare global {
  interface Window {
    electronInterop: HttpModule
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

export interface HttpModule {
  sendHttpRequest(request: IHttpRequest): Promise<IHttpResponse>;
}
