import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArmManagedComponent } from './arm-managed.component';

describe('ArmManagedComponent', () => {
  let component: ArmManagedComponent;
  let fixture: ComponentFixture<ArmManagedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArmManagedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArmManagedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
