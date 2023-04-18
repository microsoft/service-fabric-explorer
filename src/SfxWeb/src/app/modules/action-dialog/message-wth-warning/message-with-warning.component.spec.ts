import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageWithWarningComponent } from './message-with-warning.component';

describe('ArmWarningComponent', () => {
  let component: MessageWithWarningComponent;
  let fixture: ComponentFixture<MessageWithWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageWithWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageWithWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
