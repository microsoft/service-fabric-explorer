import { of } from 'rxjs';
import { StandaloneIntegration } from './Common/StandaloneIntegration';
import { AdalService } from './services/adal.service';

export function initApp(aadService: AdalService) {
  return async () => {
    try {

      console.log(StandaloneIntegration.isStandalone())

      console.log(StandaloneIntegration.clusterUrl)

      if(StandaloneIntegration.isStandalone()) {
        return of(null);
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
