import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowershellCommandsComponent } from './powershell-commands.component';

describe('PowershellCommandsComponent', () => {
  let component: PowershellCommandsComponent;
  let fixture: ComponentFixture<PowershellCommandsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PowershellCommandsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PowershellCommandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
