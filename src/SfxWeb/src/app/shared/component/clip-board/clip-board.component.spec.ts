import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ExperienceService } from 'src/app/services/experience.service';
import { ClipBoardComponent } from './clip-board.component';

describe('ClipBoardComponent', () => {
  let component: ClipBoardComponent;
  let fixture: ComponentFixture<ClipBoardComponent>;
  let clipboard: jasmine.SpyObj<Clipboard>;
  let announcer: jasmine.SpyObj<LiveAnnouncer>;
  let experience: { isNew: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    clipboard = jasmine.createSpyObj('Clipboard', ['copy']);
    clipboard.copy.and.returnValue(true);
    announcer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);
    experience = { isNew: signal(true) };
    await TestBed.configureTestingModule({
      imports: [NgbTooltipModule],
      declarations: [ClipBoardComponent],
      providers: [
        { provide: Clipboard, useValue: clipboard },
        { provide: LiveAnnouncer, useValue: announcer },
        { provide: ExperienceService, useValue: experience }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ClipBoardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('text', '  exact payload\r\nsecond line  ');
    fixture.componentRef.setInput('name', 'command');
    fixture.detectChanges();
  });

  it('copies exact text, announces success, restores focus and resets New feedback', fakeAsync(() => {
    const button = component.ref.nativeElement as HTMLButtonElement;
    const focus = spyOn(button, 'focus').and.callThrough();
    expect(button.getAttribute('aria-label')).toBe('Copy command');
    button.click();
    fixture.detectChanges();
    expect(clipboard.copy).toHaveBeenCalledOnceWith('  exact payload\r\nsecond line  ');
    expect(announcer.announce).toHaveBeenCalledOnceWith('Copied to clipboard');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(button);
    expect(button.classList.contains('copied')).toBeTrue();
    expect(button.getAttribute('aria-label')).toBe('Copied to clipboard');
    tick(1999);
    expect(component.copyState).toBe('copied');
    tick(1);
    fixture.detectChanges();
    expect(component.copyState).toBe('idle');
    expect(button.getAttribute('aria-label')).toBe('Copy command');
  }));

  it('reports failed copies and permits retry with a fresh feedback timer', fakeAsync(() => {
    clipboard.copy.and.returnValue(false);
    component.ref.nativeElement.click();
    fixture.detectChanges();
    expect(component.copyState).toBe('failed');
    expect(component.ref.nativeElement.classList.contains('failed')).toBeTrue();
    expect(component.ref.nativeElement.getAttribute('aria-label')).toBe('Copy failed. Try again');
    expect(announcer.announce).toHaveBeenCalledWith('Copy failed. Please select and copy the text manually.');
    tick(1000);
    clipboard.copy.and.returnValue(true);
    component.ref.nativeElement.click();
    tick(1000);
    expect(component.copyState).toBe('copied');
    tick(1000);
    expect(component.copyState).toBe('idle');
    expect(clipboard.copy).toHaveBeenCalledTimes(2);
  }));

  for (const isNew of [true, false]) {
    it(`blocks disabled copying in ${isNew ? 'New' : 'Classic'} experience`, () => {
      experience.isNew.set(isNew);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const button = component.ref.nativeElement as HTMLButtonElement;
      const focus = spyOn(button, 'focus');
      expect(button.disabled).toBeTrue();
      button.click();
      component.copy();
      expect(clipboard.copy).not.toHaveBeenCalled();
      expect(announcer.announce).not.toHaveBeenCalled();
      expect(focus).not.toHaveBeenCalled();
      expect(component.copyState).toBe('idle');
    });
  }

  it('resets feedback on input changes and copies the replacement payload', fakeAsync(() => {
    component.ref.nativeElement.click();
    tick(1000);
    fixture.componentRef.setInput('text', 'replacement\ntext');
    fixture.componentRef.setInput('tooltipText', 'Copy replacement');
    fixture.detectChanges();
    expect(component.copyState).toBe('idle');
    expect(component.ref.nativeElement.getAttribute('aria-label')).toBe('Copy replacement');
    component.ref.nativeElement.click();
    expect(clipboard.copy.calls.mostRecent().args).toEqual(['replacement\ntext']);
    tick(1000);
    expect(component.copyState).toBe('copied');
    tick(1000);
    expect(component.copyState).toBe('idle');
  }));

  it('clears the New feedback timer on destruction', fakeAsync(() => {
    component.ref.nativeElement.click();
    expect(component.copyState).toBe('copied');
    fixture.destroy();
    tick(2000);
    expect(component.copyState).toBe('copied');
  }));

  it('preserves Classic copy, focus and delayed tooltip feedback', fakeAsync(() => {
    experience.isNew.set(false);
    fixture.componentRef.setInput('tooltipText', 'Copy command');
    fixture.detectChanges();
    const button = component.ref.nativeElement as HTMLButtonElement;
    const focus = spyOn(button, 'focus').and.callThrough();
    const close = spyOn(component.tooltip, 'close');
    const open = spyOn(component.tooltip, 'open').and.callFake(() => {
      expect(component.tooltip.ngbTooltip).toBe('copied!');
    });
    expect(button.classList.contains('mif-copy')).toBeTrue();
    button.click();
    expect(clipboard.copy).toHaveBeenCalledOnceWith('  exact payload\r\nsecond line  ');
    expect(close).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith();
    expect(document.activeElement).toBe(button);
    tick(249);
    expect(open).not.toHaveBeenCalled();
    expect(announcer.announce).not.toHaveBeenCalled();
    tick(1);
    expect(open).toHaveBeenCalledTimes(1);
    expect(component.tooltip.ngbTooltip).toBe('Copy command');
    expect(component.tooltip.autoClose).toBeFalse();
    expect(component.tooltip.triggers).toBe('manual');
    expect(component.tooltip.closeDelay).toBe(2000);
    expect(announcer.announce).toHaveBeenCalledOnceWith('Copied to clipboard');
    expect(component.copyState).toBe('idle');
  }));
});
