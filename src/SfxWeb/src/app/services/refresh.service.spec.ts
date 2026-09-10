import { TestBed } from '@angular/core/testing';

import { RefreshService } from './refresh.service';
import { StorageService } from './storage.service';
import { of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from '../Common/Constants';

describe('RefreshService', () => {
  localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, '15');

  beforeEach(() => TestBed.configureTestingModule({
    providers: [StorageService]
  }));

  beforeEach(() => TestBed.configureTestingModule({}));

  afterEach(() => {
    // Stop any auto-refresh interval a spec started so it can't leak into later tests.
    TestBed.inject(RefreshService).updateRefreshInterval('0');
    vi.useRealTimers();
  });

  it('should be created', () => {
    const service: RefreshService = TestBed.inject(RefreshService);
    expect(service).toBeTruthy();
  });


  it('auto refresh', () => {
    vi.useFakeTimers();
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, 'OFF');

    const service: RefreshService = TestBed.inject(RefreshService);
    expect(service.refreshTick).toBe(0);

    const emittedTicks: number[] = [];
    const subscription = service.refreshSubject.subscribe(value => emittedTicks.push(value));

    // A positive interval emits once immediately, then once per interval period.
    service.updateRefreshInterval('2');
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(2000);

    expect(emittedTicks).toEqual([0, 1, 2]);

    // Stop the recurring interval so it can't leak into later tests.
    service.updateRefreshInterval('OFF');
    subscription.unsubscribe();
  });

  it('refresh all', () => new Promise<void>((done) => {
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, 'OFF');

    const service: RefreshService = TestBed.inject(RefreshService);

    service.refreshSubject.subscribe(tick => {
      expect(tick).toBe(0);
      done();
    });

    service.refreshAll();
  }));

  it('update refresh interval', async () => {
    window.localStorage.setItem(Constants.AutoRefreshIntervalStorageKey, '15');
    const service: RefreshService = TestBed.inject(RefreshService);
    service.init();

    expect(service.refreshRate).toBe('15');

    service.updateRefreshInterval('10');
    expect(service.refreshRate).toBe('10');

  });

});
