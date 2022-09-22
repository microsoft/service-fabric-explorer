import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowershellScriptDropdownComponent } from './powershell-script-dropdown.component';

describe('PowershellScriptDropdownComponent', () => {
  let component: PowershellScriptDropdownComponent;
  let fixture: ComponentFixture<PowershellScriptDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PowershellScriptDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PowershellScriptDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
