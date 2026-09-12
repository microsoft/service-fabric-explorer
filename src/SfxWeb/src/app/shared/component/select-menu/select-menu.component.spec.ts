import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectMenuComponent, SelectMenuOption } from './select-menu.component';

describe('SelectMenuComponent', () => {
  let fixture: ComponentFixture<SelectMenuComponent>;
  let component: SelectMenuComponent;
  const options: SelectMenuOption[] = [
    { value: false, label: 'Boolean false' },
    { value: 0, label: 'Numeric zero' },
    { value: 'false', label: 'String false' },
    { value: '0', label: 'String zero' },
    { value: 'blocked', label: 'Unavailable', disabled: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
  });

  for (const option of options.slice(0, 4)) {
    it(`matches and emits ${typeof option.value} ${option.value} without coercion`, () => {
      fixture.componentRef.setInput('value', option.value);
      fixture.detectChanges();
      expect(component.trigger.nativeElement.textContent).toContain(option.label);
      component.menu.open();
      fixture.detectChanges();
      const menu = document.getElementById(component.menuId)!;
      const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="option"]'));
      expect(buttons.filter(button => button.getAttribute('aria-selected') === 'true').length).toBe(1);
      const button = buttons[options.indexOf(option)];
      expect(button.getAttribute('aria-selected')).toBe('true');
      const emit = spyOn(component.valueChange, 'emit').and.callThrough();
      const focus = spyOn(component.trigger.nativeElement, 'focus').and.callThrough();
      component.valueChange.subscribe(value => {
        expect(value).toBe(option.value);
        expect(component.menu.isOpen()).toBeFalse();
        expect(document.activeElement).toBe(component.trigger.nativeElement);
      });
      button.click();
      expect(emit).toHaveBeenCalledOnceWith(option.value);
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });
  }

  it('emits a new selection without overwriting the input owned by the parent', () => {
    fixture.componentRef.setInput('value', '0');
    fixture.detectChanges();
    const emit = spyOn(component.valueChange, 'emit');
    component.choose(options[0]);
    expect(emit).toHaveBeenCalledOnceWith(false);
    expect(component.value).toBe('0');
    fixture.componentRef.setInput('value', false);
    fixture.detectChanges();
    expect(component.selectedLabel).toBe('Boolean false');
  });

  it('does not select disabled options, including direct calls', () => {
    component.menu.open();
    fixture.detectChanges();
    const button = document.getElementById(component.menuId)!.querySelectorAll<HTMLButtonElement>('button')[4];
    const emit = spyOn(component.valueChange, 'emit');
    const close = spyOn(component.menu, 'close').and.callThrough();
    const focus = spyOn(component.trigger.nativeElement, 'focus');
    expect(button.disabled).toBeTrue();
    button.click();
    component.choose(options[4]);
    expect(emit).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    expect(component.menu.isOpen()).toBeTrue();
  });

  it('blocks a disabled menu and closes programmatic opening', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const emit = spyOn(component.valueChange, 'emit');
    const focus = spyOn(component.trigger.nativeElement, 'focus');
    expect(component.trigger.nativeElement.disabled).toBeTrue();
    component.trigger.nativeElement.click();
    expect(component.menu.isOpen()).toBeFalse();
    component.choose(options[0]);
    expect(emit).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    component.menu.open();
    expect(component.menu.isOpen()).toBeFalse();
  });

  it('shows the placeholder and empty state with accessible menu linkage', () => {
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('placeholder', 'Choose a value');
    fixture.componentRef.setInput('label', 'Health filter');
    fixture.detectChanges();
    const trigger = component.trigger.nativeElement;
    expect(trigger.textContent).toContain('Choose a value');
    expect(trigger.getAttribute('aria-controls')).toBe(component.menuId);
    expect(trigger.getAttribute('aria-label')).toBe('Health filter');
    component.menu.open();
    fixture.detectChanges();
    expect(document.getElementById(component.menuId)!.textContent).toContain('No options available');
  });
});
