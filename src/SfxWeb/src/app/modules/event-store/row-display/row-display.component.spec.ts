import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RowDisplayComponent } from './row-display.component';

describe('RowDisplayComponent', () => {
  let component: RowDisplayComponent;
  let fixture: ComponentFixture<RowDisplayComponent>;

  beforeEach(async(() => {
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
