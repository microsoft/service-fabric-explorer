// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { TestBed } from '@angular/core/testing';

import { RestClientService } from './rest-client.service';

describe('RestClientService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RestClientService = TestBed.inject(RestClientService);
    expect(service).toBeTruthy();
  });
});
