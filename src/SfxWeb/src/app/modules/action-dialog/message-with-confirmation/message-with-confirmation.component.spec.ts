import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageWithConfirmation } from './message-with-confirmation.component';

describe('ActionDialogTemplateComponent', () => {
  let component: MessageWithConfirmation;
  let fixture: ComponentFixture<MessageWithConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageWithConfirmation ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageWithConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
