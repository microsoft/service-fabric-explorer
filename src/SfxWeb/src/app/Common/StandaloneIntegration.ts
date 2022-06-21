// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------
import { environment } from 'src/environments/environment';

export interface IntegrationConfig {
  preloadFunction?: string;
  windowPath: string;
  passObjectAsString?: boolean;
  handleAsCallBack?: boolean;
}

export class StandaloneIntegration {
    private static iclusterUrl: string = null;
    private static integrationConfigCached: IntegrationConfig = null;

    public static isStandalone(): boolean {
      return environment.electronWindow;
    }

    public static get integrationConfig(): IntegrationConfig {
      if(StandaloneIntegration.integrationConfigCached === null) {
         const config = StandaloneIntegration.extractQueryItem(window.location.search, 'integrationConfig');
         StandaloneIntegration.integrationConfigCached = JSON.parse(config);
      }
      return this.integrationConfigCached
    }

    public static get clusterUrl(): string {
      console.log(this.isStandalone());
        if (StandaloneIntegration.iclusterUrl == null) {
            if (StandaloneIntegration.isStandalone()) {
                StandaloneIntegration.iclusterUrl = StandaloneIntegration.extractQueryItem(window.location.search, 'targetcluster');
            } else {
                StandaloneIntegration.iclusterUrl = '';
            }
        }

        return StandaloneIntegration.iclusterUrl;
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

