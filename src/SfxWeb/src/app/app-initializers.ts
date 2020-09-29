import { AdalService } from './services/adal.service';
import { of } from 'rxjs';
import { StandaloneIntegration } from './Common/StandaloneIntegration';

export function initApp(aadService: AdalService) {
    return async () => {
        try {
            console.log(StandaloneIntegration.isStandalone())

            console.log(StandaloneIntegration.clusterUrl)

            if(StandaloneIntegration.isStandalone()) {
              return of(null);
            }

            await aadService.load().toPromise();

            if (aadService.aadEnabled){
                if (!aadService.isAuthenticated){
                    aadService.login();
                }
                aadService.handleWindowCallback();
            }
            return of(null);
        } catch {
            return of(null);
        }
    };
  }
