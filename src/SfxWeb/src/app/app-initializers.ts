
import { StandaloneIntegration } from './Common/StandaloneIntegration';
import { AdalService } from './services/adal.service';

export function initApp(aadService: AdalService) {
  return async () => {
    try {
      if(StandaloneIntegration.isStandalone()) {
        return;
      }
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
