import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthbadgeComponent } from './healthbadge.component';

describe('HealthbadgeComponent', () => {
  let component: HealthbadgeComponent;
  let fixture: ComponentFixture<HealthbadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HealthbadgeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthbadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
