import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RcaVisualizationComponent } from './rca-visualization.component';

describe('RcaVisualizationComponent', () => {
  let component: RcaVisualizationComponent;
  let fixture: ComponentFixture<RcaVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RcaVisualizationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RcaVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
