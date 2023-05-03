import { AdalService } from './services/adal.service';
import { StandaloneIntegrationService } from './services/standalone-integration.service';

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
