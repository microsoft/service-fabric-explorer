import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RowDisplayComponent } from './row-display.component';

describe('RowDisplayComponent', () => {
  let component: RowDisplayComponent;
  let fixture: ComponentFixture<RowDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RowDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RowDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
