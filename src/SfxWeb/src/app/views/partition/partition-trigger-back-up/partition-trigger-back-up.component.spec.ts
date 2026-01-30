// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PartitionTriggerBackUpComponent } from './partition-trigger-back-up.component';

describe('PartitionTriggerBackUpComponent', () => {
  let component: PartitionTriggerBackUpComponent;
  let fixture: ComponentFixture<PartitionTriggerBackUpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PartitionTriggerBackUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartitionTriggerBackUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
