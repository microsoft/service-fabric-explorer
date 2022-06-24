// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------
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
}

export class StandaloneIntegration {
    public static clusterUrl: string = null;
    public static integrationConfig: IntegrationConfig = null;

    public static setConfiguration() {
      try {
        const config = StandaloneIntegration.extractQueryItem(window.location.search, 'integrationConfig');
        StandaloneIntegration.integrationConfig = JSON.parse(config);
        console.log(this.integrationConfig);
      } catch {
        console.log("could not load any standalone integrations")
      }

      try {
        StandaloneIntegration.clusterUrl = StandaloneIntegration.extractQueryItem(window.location.search, 'targetcluster');
        console.log(this.clusterUrl)
      } catch {
        console.log("could not load any cluster url")
      }
    }

    public static isStandalone(): boolean {
      return !!(this.clusterUrl || this.integrationConfig);
    }

    private static extractQueryItem(queryString: string, name: string): string {
        if (queryString) {
            const urlParameters = window.location.search.split('?')[1];
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

