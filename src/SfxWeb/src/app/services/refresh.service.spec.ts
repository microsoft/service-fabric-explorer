import { TestBed } from '@angular/core/testing';

import { RefreshService } from './refresh.service';
import { StorageService } from './storage.service';
import { of, timer, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from '../Common/Constants';

describe('RefreshService', () => {
  localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, '15');

  beforeEach(() => TestBed.configureTestingModule({
    providers: [StorageService]
  }));

  beforeEach(() => TestBed.configureTestingModule({}));

  fit('should be created', () => {
    const service: RefreshService = TestBed.inject(RefreshService);
    expect(service).toBeTruthy();
  });


  fit('auto refresh', async (done) => {
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, 'OFF');

    const service: RefreshService = TestBed.inject(RefreshService);
    expect(service.refreshTick).toBe(0);

    service.updateRefreshInterval('2');

    await timer(3000).toPromise();

    service.refreshSubject.subscribe(tick => {
      expect(tick).toBe(2);
      done();
    });

  });

  fit('refresh all', (done) => {
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, 'OFF');

    const service: RefreshService = TestBed.inject(RefreshService);

    service.refreshSubject.subscribe(tick => {
      expect(tick).toBe(0);
      done();
    });

    service.refreshAll();
  });

  fit('update refresh interval', async () => {
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, '15');
    const service: RefreshService = TestBed.inject(RefreshService);
    service.init();

    expect(service.refreshRate).toBe('15');

    service.updateRefreshInterval('10');
    expect(service.refreshRate).toBe('10');

  });

});
