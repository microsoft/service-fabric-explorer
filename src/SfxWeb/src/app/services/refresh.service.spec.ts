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
    const service: RefreshService = TestBed.get(RefreshService);
    expect(service).toBeTruthy();
  });


  fit('add and remove refresh subject', () => {
    const service: RefreshService = TestBed.get(RefreshService);

    const keyName = 'test';
    const func = () => of(null);

    service.insertRefreshSubject(keyName, func);
    expect(service.hasRefreshSubject(keyName)).toBeTruthy();
    expect(service.refreshSubjectCount()).toBe(1);

    service.removeRefreshSubject(keyName);
    expect(service.hasRefreshSubject(keyName)).toBeFalsy();
    expect(service.refreshSubjectCount()).toBe(0);

  });

  fit('refresh all', async () => {
    const service: RefreshService = TestBed.get(RefreshService);
    let done = false;
    const keyName = 'test';
    const func = () => of(null).pipe(map( () => done = true));

    service.insertRefreshSubject(keyName, func);
    expect(service.hasRefreshSubject(keyName)).toBeTruthy();
    expect(service.refreshSubjectCount()).toBe(1);

    service.refreshAll();

    await timer(1000).toPromise();

    expect(service.isRefreshing).toBeFalsy();
    expect(done).toBeTruthy();
  });

  fit('refresh withError', async () => {
    const service: RefreshService = TestBed.get(RefreshService);
    const keyName = 'test';
    const func = () =>  throwError('error');
    let done = false;
    const keyName2 = 'success';
    const func2 = () => of(null).pipe(map( () => done = true));

    service.insertRefreshSubject(keyName, func);
    service.insertRefreshSubject(keyName2, func2);
    expect(service.refreshSubjectCount()).toBe(2);

    service.refreshAll();

    await timer(1500).toPromise();

    expect(service.isRefreshing).toBeFalsy();
    expect(done).toBeTruthy();
  });

  fit('update refresh interval', async () => {
    const service: RefreshService = TestBed.get(RefreshService);
    service.init();

    expect(service.refreshRate).toBe('15');

    service.updateRefreshInterval('10');
    expect(service.refreshRate).toBe('10');

  });

});
