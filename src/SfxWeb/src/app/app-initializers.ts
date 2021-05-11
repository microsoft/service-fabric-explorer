import { AdalService } from './services/adal.service';
import { of } from 'rxjs';

export function initApp(aadService: AdalService) {
    return async () => {
        try {
            await aadService.load().toPromise();

            if (aadService.aadEnabled){
              aadService.handleWindowCallback();
              if (!aadService.isAuthenticated){
                    aadService.login();
                }
              await waitUntil(aadService);

              return of(null);
            }else{
                return of(null);
            }
        } catch (e){
          console.log(e);
          return of(null);
        }
    };
  }


async function waitUntil(service) {
    return await new Promise(resolve => {
      const interval = setInterval(() => {
        if (!service.authContext.loginInProgress()) {
          resolve(null);
          clearInterval(interval);
        }
      }, 100);
    });
  }
