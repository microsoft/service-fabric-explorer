import { AdalService } from './services/adal.service';
import { StandaloneIntegrationService, IntegrationConfig } from './services/standalone-integration.service';
import 'highcharts';
import 'highcharts/modules/accessibility';
import 'highcharts/modules/sankey';
import 'highcharts/modules/organization';

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
