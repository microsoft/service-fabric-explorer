import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CollapseContainerComponent } from './collapse-container.component';

describe('CollapseContainerComponent keyboard activation', () => {
  it('toggles once with Enter and preserves pointer activation', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CollapseContainerComponent],
      providers: [{ provide: LiveAnnouncer, useValue: { announce: jasmine.createSpy('announce') } }]
    }).compileComponents();
    const fixture = TestBed.createComponent(CollapseContainerComponent);
    fixture.componentInstance.collapsed = true;
    const changed = spyOn(fixture.componentInstance.collapsedChange, 'emit');
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    button.dispatchEvent(enter);
    fixture.detectChanges();
    expect(enter.defaultPrevented).toBeTrue();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(changed).toHaveBeenCalledOnceWith(false);
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(changed).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });
});
