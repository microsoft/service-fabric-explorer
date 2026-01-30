// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SharedModule } from '../../shared.module';

import { DisplayDurationComponent } from './display-duration.component';

describe('DisplayDurationComponent', () => {
  let component: DisplayDurationComponent;
  let fixture: ComponentFixture<DisplayDurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayDurationComponent ],
      imports: [SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  fit('should create', () => {
    expect(component).toBeTruthy();
  });

  fit('correct colors', () => {
    component.topText = 'topTextTest';
    component.topInMilliseconds = 1000;

    component.bottomText = 'bottomText';
    component.bottomInMilliseconds = 5000;

    component.ngOnChanges();
    fixture.detectChanges();
    let barElement = fixture.debugElement.queryAll(By.css('[data-cy="bar-progress"]'));

    expect(barElement[0].styles['background-color']).toBe('var(--accent-darkblue)');
    expect(barElement[0].styles.flex).toBe('0.2 1 0%');

    component.topInMilliseconds = 3000;
    component.bottomInMilliseconds = 5000;
    component.ngOnChanges();
    fixture.detectChanges();
    barElement = fixture.debugElement.queryAll(By.css('[data-cy="bar-progress"]'));
    expect(barElement[0].styles['background-color']).toBe('yellow');
    expect(barElement[0].styles.flex).toBe('0.6 1 0%');

    component.topInMilliseconds = 4500;
    component.bottomInMilliseconds = 5000;
    component.ngOnChanges();
    fixture.detectChanges();
    barElement = fixture.debugElement.queryAll(By.css('[data-cy="bar-progress"]'));
    expect(barElement[0].styles['background-color']).toBe('red');
    expect(barElement[0].styles.flex).toBe('0.9 1 0%');

  });

});
