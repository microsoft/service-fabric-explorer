import { TestBed } from '@angular/core/testing';

import { AadConfigService } from './config-service.service';

describe('ConfigServiceService', () => {
  let service: AadConfigService;
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
    TestBed.configureTestingModule({});
    service = TestBed.inject(AadConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

//   fit('aad auth not enabled', async () => {
//     adalService.aadEnabled = false;

//     httpClient.get('/test').subscribe();

//     const requests = httpMock.match({ method: 'get' });
//     expect(requests[0].request.headers.get('Authorization')).toBeNull();
// });

// fit('aad auth enabled', async () => {
//     adalService.aadEnabled = true;

//     httpClient.get('/test').subscribe();

//     const requests = httpMock.match({ method: 'get' });
//     expect(requests[0].request.headers.get('Authorization')).toBe('Bearer aad-token');
// });

});
