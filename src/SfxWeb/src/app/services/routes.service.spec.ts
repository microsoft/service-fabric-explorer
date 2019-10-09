import { TestBed } from '@angular/core/testing';

import { RoutesService } from './routes.service';

describe('RoutesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RoutesService = TestBed.get(RoutesService);
    expect(service).toBeTruthy();
  });
});
