import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';

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


  fit('auto refresh', fakeAsync(() => {
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, 'OFF');

    const service: RefreshService = TestBed.inject(RefreshService);
    expect(service.refreshTick).toBe(0);

    service.updateRefreshInterval('2');

    // Advance 3 s: immediate refresh at t=0 (emits 0) and interval at t=2s (emits 1).
    tick(3000);

    let receivedTick: number;
    service.refreshSubject.subscribe(t => {
      receivedTick = t;
    });

    // Advance 2 s more: interval fires at t=4s and emits refreshTick value 2.
    tick(2000);

    expect(receivedTick).toBe(2);

    discardPeriodicTasks();
  }));

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
