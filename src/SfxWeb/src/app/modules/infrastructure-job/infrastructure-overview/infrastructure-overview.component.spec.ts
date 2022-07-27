import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrastructureOverviewComponent } from './infrastructure-overview.component';

describe('InfrastructureOverviewComponent', () => {
  let component: InfrastructureOverviewComponent;
  let fixture: ComponentFixture<InfrastructureOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfrastructureOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfrastructureOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
