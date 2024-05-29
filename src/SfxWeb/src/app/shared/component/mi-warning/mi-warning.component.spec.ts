import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiWarningComponent } from './mi-warning.component';

describe('MiWarningComponent', () => {
  let component: MiWarningComponent;
  let fixture: ComponentFixture<MiWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MiWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MiWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
