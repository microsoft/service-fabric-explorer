import { TestBed } from '@angular/core/testing';
import { AdalService } from './adal.service';
import { RestClientService } from './rest-client.service';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { AadMetadata } from '../Models/DataModels/Aad';
import { Observable, of } from 'rxjs';

describe('AdalService', () => {
  const restClientMock: Partial<RestClientService> = {};
  beforeEach(() => TestBed.configureTestingModule({
    providers: [{provide: RestClientService, useValue: restClientMock}]
  }));

  fit('should be created', () => {
    const service: AdalService = TestBed.inject(AdalService);
    expect(service).toBeTruthy();
  });

  fit('load', async () => {
      restClientMock.getAADmetadata = (messageHandler: IResponseMessageHandler): Observable<AadMetadata> => {
        return of(new AadMetadata({
          type: 'aad',
          metadata: {
            login: 'login',
            authority: "https://login.microsoftonline.com/123412341234"
            ,
            client: 'client-id',
            cluster: 'cluster-id',
            redirect: 'redirect',
            tenant: 'tenant-id'
          }
          }));
        };
      const service: AdalService = TestBed.inject(AdalService);

      await service.load().toPromise();

      expect(service.authContext).toBeDefined();
      expect(service.aadEnabled).toBeTruthy();
  });

  fit('load non aad authed', async () => {
    const service: AdalService = TestBed.inject(AdalService);

    restClientMock.getAADmetadata = (messageHandler: IResponseMessageHandler): Observable<AadMetadata> => {
      return of(new AadMetadata({
        type: '',
        metadata: {
          login: '',
          authority: '',
          client: '',
          cluster: '',
          redirect: '',
          tenant: ''
        }
        }));
      };

    await service.load().toPromise();

    expect(service.authContext).toBeUndefined();
    expect(service.aadEnabled).toBeFalsy();
  });

});
