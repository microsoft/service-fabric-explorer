import { TestBed } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { httpInterceptorProviders } from './http-interceptor';
import { HttpClient } from '@angular/common/http';
import { DataService } from './services/data.service';
import { environment } from 'src/environments/environment';
import { AadConfigService } from './modules/msal-dynamic-config/config-service.service';
import { AadMetadata } from './Models/DataModels/Aad';
import { MsalService } from '@azure/msal-angular';
import { Observable, of } from 'rxjs';
import { StandaloneIntegrationService } from './services/standalone-integration.service';

describe('Http interceptors', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let standaloneService: StandaloneIntegrationService;
    const dataService: Partial<DataService> = { readOnlyHeader: null, clusterNameMetadata: 'old-name' };
    const aadConfig: Partial<AadConfigService> = {
        getCluster: () => "cluster-id",
        getAuthority: () => "authority",
        aadEnabled: false,
        metaData: new AadMetadata({
            type: 'aad',
            metadata: {
                login: 'login',
                authority: 'auth',
                client: 'client-id',
                cluster: 'cluster-id',
                redirect: 'redirect',
                tenant: 'tenant-id'
            }
        })
    };

    const msalService: Partial<MsalService> = {
        acquireTokenSilent: (resource) => {
            return of({
                authority: `https://login.microsoftonline.com/${aadConfig.metaData.raw.metadata.cluster}`,
                uniqueId: "75a43bed-7b26-4adb-8f7e-018097389324",
                tenantId: aadConfig.metaData.raw.metadata.cluster,
                scopes: [],
                account: {} as any,
                idToken: 'aad-token',
                accessToken: 'aad-token',
                idTokenClaims: {} as any,
                fromCache: true,
                tokenType: "Bearer",
                expiresOn: new Date(),
                correlationId: 'some-guid'
            })
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [httpInterceptorProviders, StandaloneIntegrationService,
                { provide: DataService, useValue: dataService },
                { provide: MsalService, useValue: msalService },
                { provide: AadConfigService, useValue: aadConfig },
              ]
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
        standaloneService = TestBed.inject(StandaloneIntegrationService);
    });


    fit('readonly enabled', async () => {
        httpClient.get('/test').subscribe();

        const request = httpMock.expectOne('/test');

        const headers = {
            'SFX-Readonly': '1',
            'SFX-ClusterName': 'test-cluster'
        };
        request.flush(null, { headers });

        expect(dataService.readOnlyHeader).toBeTruthy();
        expect(dataService.clusterNameMetadata).toBe('test-cluster');
    });

    fit('SFRP headers lowercase', async () => {
      httpClient.get('/test').subscribe();

      const request = httpMock.expectOne('/test');

      const headers = {
          'sfx-readonly': '1',
          'sfx-clustername': 'test-cluster'
      };
      request.flush(null, { headers });

      expect(dataService.readOnlyHeader).toBeTruthy();
      expect(dataService.clusterNameMetadata).toBe('test-cluster');
  });

    fit('readonly off', async () => {
        httpClient.get('/test').subscribe();

        const request = httpMock.expectOne('/test');

        const headers = { 'SFX-Readonly': '0' };
        request.flush(null, { headers });

        expect(dataService.readOnlyHeader).toBeFalsy();
    });

    fit('client headers sent', async () => {
        httpClient.get('/test').subscribe();

        const requests = httpMock.match({ method: 'get' });
        expect(requests[0].request.headers.get('x-servicefabricclienttype')).toBe('SFX');
        expect(requests[0].request.headers.get('sfx-build')).toBe(environment.version);
    });

    fit('aad auth not enabled', async () => {
        aadConfig.aadEnabled = false;

        httpClient.get('/test').subscribe();

        const requests = httpMock.match({ method: 'get' });
        expect(requests[0].request.headers.get('Authorization')).toBeNull();
    });

    fit('aad auth enabled', async () => {
        aadConfig.aadEnabled = true;

        httpClient.get('/test').subscribe();

        const requests = httpMock.match({ method: 'get' });
        expect(requests[0].request.headers.get('Authorization')).toBe('Bearer aad-token');
    });

    fit('standalone interceptor does not fire', () => {
      standaloneService.setConfiguration("?");

      spyOn(standaloneService, 'getIntegrationCaller');

      httpClient.get('/test').subscribe();

      expect(standaloneService.getIntegrationCaller).not.toHaveBeenCalled();

  });

  fit('standalone interceptor does fire', (done: DoneFn) => {
    standaloneService.setConfiguration("integrationConfig={%20%20%22preloadFunction%22:%20%22CefSharp.BindObjectAsync%22,%20%20%22windowPath%22:%20%22CefSharp.PostMessage%22,%20%20%22passObjectAsString%22:%20true,%20%20%22handleAsCallBack%22:%20true}&=Onebox/Local%20cluster%20-%20http://localhost:19080#/");

    spyOn(standaloneService, 'getIntegrationCaller').and.returnValue(
      (integrationData) => {
        integrationData.Callback(JSON.stringify({
          "statusMessage": "OK",
          "statusCode": "200",
          "data": {
            "someData": "data"
          }
        }))
      });

    let res = null
    httpClient.get('/test').subscribe(r => {
      expect(standaloneService.getIntegrationCaller).toHaveBeenCalled();
      expect(r).toEqual({
        "someData": "data"
      })
      done();
    });

  });
});
