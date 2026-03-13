// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { AdalService } from './services/adal.service';
import { StandaloneIntegrationService } from './services/standalone-integration.service';
import Highcharts from 'highcharts';
import Accessibility from 'highcharts/modules/accessibility';
import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
Accessibility(Highcharts);
HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);

export function initApp(aadService: AdalService, standaloneIntegrationService: StandaloneIntegrationService) {
  return async () => {
    try {
      if("SFXintegrationConfiguration" in window) {
        standaloneIntegrationService.setConfiguration((window as any).SFXintegrationConfiguration);
      }
      if(standaloneIntegrationService.isStandalone()) {
        return;
      }

      //dont load any aad configuration if standalone
      //all auth must be done by the integration
      await aadService.load().toPromise();

      if (aadService.aadEnabled) {
        aadService.handleWindowCallback();
        if (!aadService.isAuthenticated) {
          aadService.login();
        }
      }
    } catch (e) {
      console.log(e);
    }
  };
}
