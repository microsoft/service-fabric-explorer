import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ScaleServiceComponent } from './scale-service.component';

describe('ScaleServiceComponent', () => {
  let component: ScaleServiceComponent;
  let fixture: ComponentFixture<ScaleServiceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScaleServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScaleServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
