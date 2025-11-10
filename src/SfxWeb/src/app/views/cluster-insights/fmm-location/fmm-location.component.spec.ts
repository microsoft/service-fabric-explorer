import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FmmLocationComponent } from './fmm-location.component';

describe('FmmLocationComponent', () => {
  let component: FmmLocationComponent;
  let fixture: ComponentFixture<FmmLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FmmLocationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FmmLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
