import { AdalService } from './services/adal.service';
import { StandaloneIntegrationService } from './services/standalone-integration.service';
import Highcharts from 'highcharts';
import Accessibility from 'highcharts/modules/accessibility';
Accessibility(Highcharts);

export function initApp(aadService: AdalService, standaloneIntegrationService: StandaloneIntegrationService) {
  return async () => {
    try {
      if(window.location.search.includes("?")) {
        standaloneIntegrationService.setConfiguration(window.location.search.split('?')[1]);
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
