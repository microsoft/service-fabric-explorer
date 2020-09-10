import { AdalService } from './services/adal.service';
import { of } from 'rxjs';

export function initApp(aadService: AdalService) {
    return async () => {
        try {
            await aadService.load().toPromise();

            if (aadService.aadEnabled){
                if (!aadService.isAuthenticated){
                    aadService.login();
                }
                aadService.handleWindowCallback();

                return of(null);
            }else{
                return of(null);
            }
        } catch {
            return of(null);
        }
    };
  }
