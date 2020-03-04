import { TestBed } from '@angular/core/testing';

import { AdalService } from './adal.service';

describe('AdalService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AdalService = TestBed.get(AdalService);
    expect(service).toBeTruthy();
  });
});
