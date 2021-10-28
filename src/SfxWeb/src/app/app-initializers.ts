import { AdalService } from './services/adal.service';
import { of } from 'rxjs';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { RestClientService } from './services/rest-client.service';
import { InteractionStatus, PublicClientApplication } from '@azure/msal-browser';
import { filter, take } from 'rxjs/operators';

// , msalService: MsalService
export function initApp(aadService: AdalService, msalService: MsalService, restClient: RestClientService, msalBroadcastService: MsalBroadcastService) {
    return async () => {
        try {
            // const aadMetaData = await restClient.getAADmetadata().toPromise();

            // if(aadMetaData.isAadAuthType) {
            //   msalService.instance = new PublicClientApplication({
            //     auth: {
            //       clientId: aadMetaData.raw.metadata.cluster,
            //       authority: `https://login.microsoftonline.com/${aadMetaData.raw.metadata.tenant}`,
            //       // redirectUri: 'http://localhost:4200',
            //       // postLogoutRedirectUri: 'http://localhost:4200'
            //     }
            //   });

              // msalBroadcastService.inProgress$
              // .pipe(
              //   // filter((status: InteractionStatus) => status === InteractionStatus.None),
              // ).subscribe((data) => {
              //   console.log(data)
              // })

              // await msalService.loginRedirect();

              // console.log(msalService.instance.getAllAccounts(), msalService.instance.getActiveAccount())
              // if(!msalService.instance.getActiveAccount()) {

              // await msalBroadcastService.inProgress$
              // .pipe(
              //   filter((status: InteractionStatus) => status === InteractionStatus.None),
              //   take(1)
              // ).toPromise();
                // await msalService.loginRedirect();
                // await msalService.loginPopup();

              // }
            // }else{

            // }

            // await aadService.load().toPromise();
            // console.log(msalService)
            // console.log(msalService.instance.getActiveAccount())

            // if (aadService.aadEnabled){
            //     if (!aadService.isAuthenticated){
            //         aadService.login();
            //     }
            //     aadService.handleWindowCallback();

            //     return of(null);
            // }else{
                return of(null);
            // }
        } catch (e) {
          console.log(e)
            return of(null);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };
}
