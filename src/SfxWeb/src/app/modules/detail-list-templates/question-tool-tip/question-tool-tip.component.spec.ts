import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionToolTipComponent } from './question-tool-tip.component';

describe('QuestionToolTipComponent', () => {
  let component: QuestionToolTipComponent;
  let fixture: ComponentFixture<QuestionToolTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionToolTipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionToolTipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
