import { AdalService } from './services/adal.service';
import { StandaloneIntegrationService, IntegrationConfig } from './services/standalone-integration.service';
import Highcharts from 'highcharts';
import Accessibility from 'highcharts/modules/accessibility';
import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
Accessibility(Highcharts);
HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);

declare global {
  interface Window {
    SFXintegrationConfiguration?: IntegrationConfig;
  }
}

export function initApp(aadService: AdalService, standaloneIntegrationService: StandaloneIntegrationService) {
  return async () => {
    try {
      if("SFXintegrationConfiguration" in window) {
        standaloneIntegrationService.setConfiguration(window.SFXintegrationConfiguration!);
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
