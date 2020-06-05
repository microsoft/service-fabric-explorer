import { TestBed } from '@angular/core/testing';

import { RefreshService } from './refresh.service';

describe('RefreshService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RefreshService = TestBed.get(RefreshService);
    expect(service).toBeTruthy();
  });
});
