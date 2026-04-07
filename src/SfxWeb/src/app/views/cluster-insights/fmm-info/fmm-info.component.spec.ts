import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FmmInfoComponent } from './fmm-info.component';

describe('FmmInfoComponent', () => {
  let component: FmmInfoComponent;
  let fixture: ComponentFixture<FmmInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FmmInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FmmInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
