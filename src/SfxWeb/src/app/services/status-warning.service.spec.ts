// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { TestBed } from '@angular/core/testing';

import { StatusWarningService } from './status-warning.service';

describe('StatusWarningService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StatusWarningService = TestBed.inject(StatusWarningService);
    expect(service).toBeTruthy();
  });
});
