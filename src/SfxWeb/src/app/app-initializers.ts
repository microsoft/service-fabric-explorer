
import { StandaloneIntegration } from './Common/StandaloneIntegration';
import { AdalService } from './services/adal.service';
import { Utils } from './Utils/Utils';

export function initApp(aadService: AdalService) {
  return async () => {
    try {
      if(StandaloneIntegration.isStandalone()) {
        const config = StandaloneIntegration.integrationConfig;
         try {
          if(config.preloadFunction) {
            await Utils.result(window, config.preloadFunction);
          }
         } catch(e) {
           console.log(e)
         }
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
