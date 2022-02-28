import { of } from 'rxjs';
import { StandaloneIntegration } from './Common/StandaloneIntegration';
import { AdalService } from './services/adal.service';
import { RestClientService } from './services/rest-client.service';

export function initApp(aadService: AdalService, restClient: RestClientService) {
  return async () => {
    try {
      console.log(StandaloneIntegration.isStandalone());

      console.log(StandaloneIntegration.clusterUrl);

      if (StandaloneIntegration.isStandalone()) {
        // await restClient.getStandAloneClient();
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
