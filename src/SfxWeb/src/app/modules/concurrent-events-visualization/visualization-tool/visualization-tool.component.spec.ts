import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizationToolComponent } from './visualization-tool.component';

describe('VisualizationToolComponent', () => {
  let component: VisualizationToolComponent;
  let fixture: ComponentFixture<VisualizationToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisualizationToolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizationToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
