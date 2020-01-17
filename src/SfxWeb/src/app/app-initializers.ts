import { AdalService } from './services/adal.service';
import { of } from 'rxjs';

export function initApp(aadService: AdalService) {
    return async () => {
        await aadService.load().toPromise();

        aadService.handleWindowCallback()

        if(aadService.aadEnabled){
            if(!aadService.isAuthenticated){
                aadService.login();
            }

            return of(null)
        }else{
            return of(null);
        }
    };
  }