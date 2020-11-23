import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DisplayNameColumnComponent } from './display-name-column.component';

describe('DisplayNameColumnComponent', () => {
  let component: DisplayNameColumnComponent;
  let fixture: ComponentFixture<DisplayNameColumnComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayNameColumnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayNameColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
