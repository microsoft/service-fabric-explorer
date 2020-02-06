import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScaleServiceComponent } from './scale-service.component';

describe('ScaleServiceComponent', () => {
  let component: ScaleServiceComponent;
  let fixture: ComponentFixture<ScaleServiceComponent>;

  beforeEach(async(() => {
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
