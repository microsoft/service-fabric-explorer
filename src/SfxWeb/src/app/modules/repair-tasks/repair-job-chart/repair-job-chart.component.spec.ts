// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairJobChartComponent } from './repair-job-chart.component';

describe('RepairJobChartComponent', () => {
  let component: RepairJobChartComponent;
  let fixture: ComponentFixture<RepairJobChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RepairJobChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepairJobChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
