import { TestBed } from '@angular/core/testing';
import { MsalService } from './msal.service';
import { RestClientService } from './rest-client.service';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { AadMetadata } from '../Models/DataModels/Aad';
import { Observable, of } from 'rxjs';

describe('MsalService', () => {
  const restClientMock: Partial<RestClientService> = {};
  beforeEach(() => TestBed.configureTestingModule({
    providers: [{provide: RestClientService, useValue: restClientMock}]
  }));

  it('should be created', () => {
    const service: MsalService = TestBed.inject(MsalService);
    expect(service).toBeTruthy();
  });

  it('load', async () => {
    const service: MsalService = TestBed.inject(MsalService);

    restClientMock.getAADmetadata = (messageHandler: IResponseMessageHandler): Observable<AadMetadata> => {
      return of(new AadMetadata({
        type: 'aad',
        metadata: {
          login: 'login',
          authority: 'auth',
          client: 'client-id',
          cluster: 'cluster-id',
          redirect: 'redirect',
          tenant: 'tenant-id'
        }
        }));
      };

    await service.load().toPromise();

    expect(service.authContext).toBeDefined();
    expect(service.aadEnabled).toBeTruthy();
  });

  it('load non aad authed', async () => {
    const service: MsalService = TestBed.inject(MsalService);

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

  it('login triggers a redirect', async () => {
    const service: MsalService = TestBed.inject(MsalService);

    restClientMock.getAADmetadata = (): Observable<AadMetadata> => of(new AadMetadata({
      type: 'aad',
      metadata: { login: 'https://login.microsoftonline.com', authority: '', client: 'client-id', cluster: 'cluster-id', redirect: '', tenant: 'tenant-id' }
    }));

    await service.load().toPromise();

    const loginRedirect = vi.spyOn(service.authContext, 'loginRedirect').mockResolvedValue(undefined);

    await service.login();

    expect(loginRedirect).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['cluster-id/.default'] }));
  });

});
