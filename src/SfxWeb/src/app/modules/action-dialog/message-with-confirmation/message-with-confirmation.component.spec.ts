import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageWithConfirmationComponent } from './message-with-confirmation.component';

describe('ActionDialogTemplateComponent', () => {
  let component: MessageWithConfirmationComponent;
  let fixture: ComponentFixture<MessageWithConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageWithConfirmationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageWithConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
