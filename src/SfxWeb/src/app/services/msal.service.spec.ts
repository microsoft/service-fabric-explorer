import { TestBed } from '@angular/core/testing';
import { MsalService } from './msal.service';
import { RestClientService } from './rest-client.service';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { AadMetadata } from '../Models/DataModels/Aad';
import { Observable, of, firstValueFrom } from 'rxjs';
import { ServerError, InteractionRequiredAuthError } from '@azure/msal-browser';

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
          login: 'https://login.microsoftonline.com',
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
    expect(service.authContext.getConfiguration().auth.authority).toBe('https://login.microsoftonline.com/tenant-id');
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

  it('surfaces a SPA-registration error when token redemption fails cross-origin', async () => {
    const service: MsalService = TestBed.inject(MsalService);

    restClientMock.getAADmetadata = (): Observable<AadMetadata> => of(new AadMetadata({
      type: 'aad',
      metadata: { login: 'https://login.microsoftonline.com', authority: '', client: 'client-id', cluster: 'cluster-id', redirect: '', tenant: 'tenant-id' }
    }));

    await service.load().toPromise();

    // Actual AAD /token response for a "Web"-registered reply UR. MSAL wraps this into a ServerError whose errorNo is error_codes[0].
    const aadResponse = {
      error: 'invalid_request',
      error_description:
        "AADSTS9002326: Cross-origin token redemption is permitted only for the 'Single-Page Application' "
        + "client-type. Request origin: 'http://localhost:3000'. Trace ID: c1b3e6c9-24ff-436d-96aa-c00e6fa11000 "
        + 'Correlation ID: 01a09ec2-79b3-73a7-a16b-d3708e3f4e83 Timestamp: 2026-09-14 07:12:18Z',
      error_codes: [9002326],
      correlation_id: '01a09ec2-79b3-73a7-a16b-d3708e3f4e83',
    };
    const serverError = new ServerError(
      aadResponse.error,
      aadResponse.correlation_id,
      aadResponse.error_description,
      undefined,
      aadResponse.error_codes[0] as unknown as string,
    );
    vi.spyOn(service.authContext, 'handleRedirectPromise').mockRejectedValue(serverError);

    await service.handleWindowCallback();

    expect(service.authErrorCode).toBe('9002326');
    expect(service.isAuthenticated).toBeFalsy();
  });

  it('acquireTokenResilient re-invokes acquireTokenSilent on each retry of a transient failure', async () => {
    const service: MsalService = TestBed.inject(MsalService);

    restClientMock.getAADmetadata = (): Observable<AadMetadata> => of(new AadMetadata({
      type: 'aad',
      metadata: { login: 'https://login.microsoftonline.com', authority: '', client: 'client-id', cluster: 'cluster-id', redirect: '', tenant: 'tenant-id' }
    }));

    await service.load().toPromise();

    const acquireTokenSilent = vi.spyOn(service.authContext, 'acquireTokenSilent')
      .mockRejectedValueOnce(new Error('network blip'))
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValue({ accessToken: 'access-token' } as any);

    const token = await firstValueFrom(service.acquireTokenResilient('cluster-id'));

    expect(token).toBe('access-token');
    // defer() makes retry re-invoke the call (1 initial + 2 retries); a bare from(promise) would call it once.
    expect(acquireTokenSilent).toHaveBeenCalledTimes(3);
  });

  it('acquireTokenResilient falls back to a single interactive redirect when interaction is required', async () => {
    const service: MsalService = TestBed.inject(MsalService);

    restClientMock.getAADmetadata = (): Observable<AadMetadata> => of(new AadMetadata({
      type: 'aad',
      metadata: { login: 'https://login.microsoftonline.com', authority: '', client: 'client-id', cluster: 'cluster-id', redirect: '', tenant: 'tenant-id' }
    }));

    await service.load().toPromise();

    const acquireTokenSilent = vi.spyOn(service.authContext, 'acquireTokenSilent')
      .mockRejectedValue(new InteractionRequiredAuthError('interaction_required', 'test-correlation-id'));
    const acquireTokenRedirect = vi.spyOn(service.authContext, 'acquireTokenRedirect').mockResolvedValue(undefined);

    const results = await Promise.allSettled([
      firstValueFrom(service.acquireTokenResilient('cluster-id')),
      firstValueFrom(service.acquireTokenResilient('cluster-id')),
    ]);

    expect(results.every(r => r.status === 'rejected')).toBe(true);
    // Interaction-required is not retried: one silent attempt per request.
    expect(acquireTokenSilent).toHaveBeenCalledTimes(2);
    // Guard ensures concurrent failures trigger only one full-page redirect.
    expect(acquireTokenRedirect).toHaveBeenCalledTimes(1);
  });

});
