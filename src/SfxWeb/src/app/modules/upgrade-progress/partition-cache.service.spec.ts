import { TestBed } from '@angular/core/testing';

import { PartitionCacheService } from './partition-cache.service';

describe('PartitionCacheService', () => {
  let service: PartitionCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartitionCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
