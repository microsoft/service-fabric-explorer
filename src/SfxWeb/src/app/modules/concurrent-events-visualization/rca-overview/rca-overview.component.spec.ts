import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RcaOverviewComponent } from './rca-overview.component';

describe('RcaOverviewComponent', () => {
  let component: RcaOverviewComponent;
  let fixture: ComponentFixture<RcaOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RcaOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RcaOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
