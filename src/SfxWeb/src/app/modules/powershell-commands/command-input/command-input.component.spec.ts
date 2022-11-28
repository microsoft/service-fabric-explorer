import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandInputComponent } from './command-input.component';

describe('CommandInputComponent', () => {
  let component: CommandInputComponent;
  let fixture: ComponentFixture<CommandInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommandInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
