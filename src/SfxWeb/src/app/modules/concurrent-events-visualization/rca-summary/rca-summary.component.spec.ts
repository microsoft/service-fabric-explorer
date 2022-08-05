import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RcaSummaryComponent } from './rca-summary.component';

describe('RcaSummaryComponent', () => {
  let component: RcaSummaryComponent;
  let fixture: ComponentFixture<RcaSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RcaSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RcaSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
