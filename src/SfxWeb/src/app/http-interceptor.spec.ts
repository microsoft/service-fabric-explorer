import { TestBed } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { httpInterceptorProviders } from './http-interceptor';
import { HttpClient } from '@angular/common/http';
import { DataService } from './services/data.service';
import { environment } from 'src/environments/environment';
import { AdalService } from './services/adal.service';
import { of } from 'rxjs';
import { AadMetadata } from './Models/DataModels/Aad';
import { StandaloneIntegrationService } from './services/standalone-integration.service';

describe('Http interceptors', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let standaloneService: StandaloneIntegrationService;
    const dataService: Partial<DataService> = { readOnlyHeader: null, clusterNameMetadata: 'old-name' };
    const adalService: Partial<AdalService> = {
        aadEnabled: false,
        acquireTokenResilient: (resource) => of('aad-token'),
        config: new AadMetadata({
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

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [httpInterceptorProviders, StandaloneIntegrationService,
                { provide: DataService, useValue: dataService },
                { provide: AdalService, useValue: adalService }]
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
        adalService.aadEnabled = false;

        httpClient.get('/test').subscribe();

        const requests = httpMock.match({ method: 'get' });
        expect(requests[0].request.headers.get('Authorization')).toBeNull();
    });

    fit('aad auth enabled', async () => {
        adalService.aadEnabled = true;

        httpClient.get('/test').subscribe();

        const requests = httpMock.match({ method: 'get' });
        expect(requests[0].request.headers.get('Authorization')).toBe('Bearer aad-token');
    });

    fit('standalone interceptor does not fire', () => {
      standaloneService.setConfiguration(null);

      spyOn(standaloneService, 'getIntegrationCaller');

      httpClient.get('/test').subscribe();

      expect(standaloneService.getIntegrationCaller).not.toHaveBeenCalled();

  });

  fit('standalone interceptor does fire', (done: DoneFn) => {
    standaloneService.setConfiguration({passObjectAsString : true, handleAsCallBack : true, windowPath: "path"});

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
