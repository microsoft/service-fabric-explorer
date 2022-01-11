import { TestBed } from '@angular/core/testing';

import { AadWrapperService } from './aad-wrapper.service';

describe('AadWrapperService', () => {
  let service: AadWrapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AadWrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
