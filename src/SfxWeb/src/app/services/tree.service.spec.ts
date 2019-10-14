import { TestBed } from '@angular/core/testing';

import { TreeService } from './tree.service';

describe('TreeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeService = TestBed.get(TreeService);
    expect(service).toBeTruthy();
  });
});
