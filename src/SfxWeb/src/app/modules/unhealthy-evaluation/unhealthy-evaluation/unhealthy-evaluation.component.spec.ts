import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnhealthyEvaluationComponent } from './unhealthy-evaluation.component';

describe('UnhealthyEvaluationComponent', () => {
  let component: UnhealthyEvaluationComponent;
  let fixture: ComponentFixture<UnhealthyEvaluationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnhealthyEvaluationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnhealthyEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
