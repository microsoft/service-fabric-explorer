import { HttpBackend, HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AadConfigService } from './config-service.service';

describe('ConfigServiceService', () => {
  let service: AadConfigService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    service = new AadConfigService({} as HttpBackend);
    service.http = httpClientSpy;
  });

  fit('should be created', () => {
    expect(service).toBeTruthy();
  });

  fit('aad auth not enabled', async () => {
    httpClientSpy.get.and.returnValue(of({ type: '', metadata: {} }));

    await service.init();
    expect(service.aadEnabled).toBeFalse();
  });

  fit('aad auth enabled', async () => {
    httpClientSpy.get.and.returnValue(of({
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

    await service.init();
    expect(service.aadEnabled).toBeTrue();
  });

});
