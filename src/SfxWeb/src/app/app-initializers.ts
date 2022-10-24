import { AdalService } from './services/adal.service';
import { StandaloneIntegrationService } from './services/standalone-integration.service';

export function initApp(aadService: AdalService, standaloneIntegrationService: StandaloneIntegrationService) {
  return async () => {
    try {
      if (window.location.search.includes("?")) {
        standaloneIntegrationService.setConfiguration(window.location.search.split('?')[1]);
      }
      if (standaloneIntegrationService.isStandalone()) {
        return;
      }

      //dont load any aad configuration if standalone
      //all auth must be done by the integration
      await aadService.load().toPromise();

      if (aadService.aadEnabled) {
        console.log(aadService.userInfo)
        if(!aadService.context.urlContainsHash(window.location.hash) && !aadService.isAuthenticated) {
          await aadService.context.loginPopup(
          //   {
          //   authority: aadService.config.raw.metadata.authority,
          //   scopes: [`${aadService.config.raw.metadata.authority}/.default`]
          // }
          );
        }
        // console.log(aadService.isAuthenticated)
        // console.log(aadService.context.urlContainsHash(window.location.hash))
        // if (!aadService.context.urlContainsHash(window.location.hash) && !aadService.isAuthenticated) {
        //   aadService.login();
        // }else{
        //   console.log(aadService)
        // }
      }
      console.log("done")
    } catch (e) {
      console.log(e);
    }
  };
}
