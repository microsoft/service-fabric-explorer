import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { ExperienceService } from 'src/app/services/experience.service';
import { CommandEditorComponent } from './command-editor.component';

describe('CommandEditorComponent', () => {
  let fixture: ComponentFixture<CommandEditorComponent>;
  let component: CommandEditorComponent;
  let clipboard: jasmine.SpyObj<Clipboard>;

  beforeEach(async () => {
    clipboard = jasmine.createSpyObj('Clipboard', ['copy']);
    clipboard.copy.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [CommandEditorComponent],
      providers: [
        { provide: Clipboard, useValue: clipboard },
        { provide: LiveAnnouncer, useValue: jasmine.createSpyObj('LiveAnnouncer', ['announce']) },
        { provide: ExperienceService, useValue: { isNew: signal(true) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CommandEditorComponent);
    component = fixture.componentInstance;
  });

  function render(parameters: PowershellCommandParameter[], safety = CommandSafetyLevel.safe) {
    const command = new PowershellCommand('Test command', '', safety, 'Test-ServiceFabric', parameters);
    fixture.componentRef.setInput('command', command);
    fixture.detectChanges();
    return command;
  }

  function enter(name: string, value: string) {
    const input = fixture.nativeElement.querySelector(`[id="${component.fieldPrefix}${name}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
    return input;
  }

  it('requires text and enum values before enabling copy and revalidates cleared inputs', () => {
    const command = render([
      new PowershellCommandParameter('Name', CommandParamTypes.string, { required: true }),
      new PowershellCommandParameter('State', CommandParamTypes.enum, { required: true, options: ['OK', 'Error'] }),
      new PowershellCommandParameter('Description', CommandParamTypes.string)
    ]);
    const copy = fixture.nativeElement.querySelector('app-clip-board button') as HTMLButtonElement;
    expect(component.required.map(param => param.name)).toEqual(['Name', 'State']);
    expect(component.optional.map(param => param.name)).toEqual(['Description']);
    expect(component.form.invalid).toBeTrue();
    expect(copy.disabled).toBeTrue();
    expect(copy.getAttribute('aria-label')).toBe('Complete the required parameters before copying');
    copy.click();
    expect(clipboard.copy).not.toHaveBeenCalled();
    const name = enter('Name', 'fabric:/app');
    expect(copy.disabled).toBeTrue();
    enter('State', 'OK');
    expect(component.form.valid).toBeTrue();
    expect(name.getAttribute('aria-invalid')).toBe('false');
    expect(copy.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('.validation')).toBeNull();
    expect(command.getParam('Name').value).toBe('fabric:/app');
    expect(component.script).toBe('Test-ServiceFabric -Name "fabric:/app" -State OK');
    copy.click();
    expect(clipboard.copy).toHaveBeenCalledOnceWith(component.script);
    enter('Name', '');
    name.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(copy.disabled).toBeTrue();
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('.field-help').textContent).toContain('Enter a value for Name.');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Complete all required parameters');
  });

  it('preserves initial numeric zero and generates zero entered through the number input', () => {
    const parameter = new PowershellCommandParameter('TimeoutSec', CommandParamTypes.number, { required: true });
    parameter.value = 0;
    render([parameter]);
    expect(component.form.controls.TimeoutSec.value).toBe(0);
    expect(component.form.valid).toBeTrue();
    expect(component.script).toBe('Test-ServiceFabric -TimeoutSec 0');
    enter('TimeoutSec', '');
    expect(component.form.invalid).toBeTrue();
    enter('TimeoutSec', '0');
    // The dynamically bound input type currently uses Angular's text value accessor.
    expect(component.command.getParam('TimeoutSec').value).toBe('0');
    expect(component.form.valid).toBeTrue();
    expect(component.script).toBe('Test-ServiceFabric -TimeoutSec 0');
  });

  it('omits false toggles and generates switch flags and true boolean arguments', () => {
    render([
      new PowershellCommandParameter('Force', CommandParamTypes.switch, { required: true }),
      new PowershellCommandParameter('IgnoreConstraints', CommandParamTypes.bool, { required: true })
    ]);
    expect(component.form.value).toEqual({ Force: false, IgnoreConstraints: false });
    expect(component.form.valid).toBeTrue();
    expect(component.script).toBe('Test-ServiceFabric ');
    const toggles = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    toggles.forEach(toggle => toggle.click());
    fixture.detectChanges();
    expect(component.script).toBe('Test-ServiceFabric -Force -IgnoreConstraints $True');
    expect(component.command.getParam('IgnoreConstraints').value).toBeTrue();
    toggles.forEach(toggle => toggle.click());
    fixture.detectChanges();
    expect(component.script).toBe('Test-ServiceFabric ');
  });

  it('keeps dangerous output commented and renders parameter content as text', () => {
    render([new PowershellCommandParameter('Name', CommandParamTypes.string)], CommandSafetyLevel.dangerous);
    enter('Name', '<script>alert(1)</script>');
    const expected = '#Test-ServiceFabric -Name "<script>alert(1)</script>"';
    expect(component.script).toBe(expected);
    expect(fixture.nativeElement.querySelector('pre').textContent).toBe(expected);
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.querySelector('.risk').textContent).toBe('Dangerous');
    expect(fixture.nativeElement.querySelector('.risk-notice').textContent).toContain('Generated output is commented out.');
    fixture.nativeElement.querySelector('app-clip-board button').click();
    expect(clipboard.copy).toHaveBeenCalledOnceWith(expected);
  });

  it('unsubscribes the old form when replacing the command', () => {
    const oldCommand = render([new PowershellCommandParameter('Old', CommandParamTypes.string, { required: true })]);
    const oldForm = component.form;
    const command = render([new PowershellCommandParameter('New', CommandParamTypes.number)]);
    const generate = spyOn(command, 'getScript').and.callThrough();
    oldForm.controls.Old.setValue('stale');
    expect(oldCommand.getParam('Old').value).toBeUndefined();
    expect(generate).not.toHaveBeenCalled();
    expect(Object.keys(component.form.controls)).toEqual(['New']);
    expect(component.required).toEqual([]);
    expect(component.script).toBe('Test-ServiceFabric ');
    component.form.controls.New.setValue(0);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(command.getParam('New').value).toBe(0);
  });

  it('unsubscribes form updates on destruction', () => {
    const command = render([new PowershellCommandParameter('Name', CommandParamTypes.string)]);
    const form = component.form;
    const generate = spyOn(command, 'getScript').and.callThrough();
    fixture.destroy();
    form.controls.Name.setValue('after destruction');
    expect(command.getParam('Name').value).toBeUndefined();
    expect(generate).not.toHaveBeenCalled();
    expect(component.script).toBe('Test-ServiceFabric ');
  });
});
