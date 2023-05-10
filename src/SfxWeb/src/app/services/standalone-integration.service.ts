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
  windowPath: string;
  passObjectAsString?: boolean;
  handleAsCallBack?: boolean;
  isReadOnlyMode?: boolean;
  clusterInfo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StandaloneIntegrationService {

  constructor() { }

  public clusterUrl: string = null;
  public integrationConfig: IntegrationConfig = null;

  public setConfiguration(configuration: IntegrationConfig) {
    try {
      this.integrationConfig = configuration
    } catch {
      console.log("could not load any standalone integrations")
    }

    try {
      this.clusterUrl = configuration.clusterInfo;
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
}

