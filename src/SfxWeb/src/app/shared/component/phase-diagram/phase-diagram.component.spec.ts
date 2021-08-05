import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaseDiagramComponent } from './phase-diagram.component';

describe('PhaseDiagramComponent', () => {
  let component: PhaseDiagramComponent;
  let fixture: ComponentFixture<PhaseDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhaseDiagramComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaseDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
