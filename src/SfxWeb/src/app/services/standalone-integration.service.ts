import { Injectable } from '@angular/core';
import { Utils } from '../Utils/Utils';
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
  method: string;
  url: string;
  headers?: Array<IHttpHeader>;
  body?: any;
}

export interface IntegrationConfig {
  preloadFunction?: string;
  windowPath: string;
  passObjectAsString?: boolean;
  handleAsCallBack?: boolean;
  isReadOnlyMode?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StandaloneIntegrationService {

  constructor() { }

  public clusterUrl: string = null;
  public integrationConfig: IntegrationConfig = null;

  public setConfiguration(configurationUrl: string) {
    try {
      const config = this.extractQueryItem(configurationUrl, 'integrationConfig');
      this.integrationConfig = JSON.parse(config);
      console.log(this.integrationConfig);
    } catch {
      console.log("could not load any standalone integrations")
    }

    try {
      this.clusterUrl = this.extractQueryItem(configurationUrl, 'targetcluster');
      console.log(this.clusterUrl)
    } catch {
      console.log("could not load any cluster url")
    }
  }

  public isStandalone(): boolean {
    return !!(this.clusterUrl || this.integrationConfig);
  }

  public getIntegrationCaller(): any {
    return Utils.result2(window, this.integrationConfig.windowPath);
  }

  private extractQueryItem(queryString: string, name: string): string {
      if (queryString) {
          const urlParameters = queryString;
          const queryParams = urlParameters.split('&');
          for (const q of queryParams) {
              const queryParam = q.split('=');
              if (queryParam[0] === name) {
                  return decodeURIComponent(queryParam[1]);
              }
          }
      }
      return null;
  }
}

