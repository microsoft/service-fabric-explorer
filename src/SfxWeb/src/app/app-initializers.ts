import { AdalService } from './services/adal.service';

export function initApp(aadService: AdalService) {
  return async () => {
    try {
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
