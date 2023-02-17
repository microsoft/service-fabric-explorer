import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionDialogTemplateComponent } from './action-dialog-template.component';

describe('ActionDialogTemplateComponent', () => {
  let component: ActionDialogTemplateComponent;
  let fixture: ComponentFixture<ActionDialogTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActionDialogTemplateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionDialogTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
