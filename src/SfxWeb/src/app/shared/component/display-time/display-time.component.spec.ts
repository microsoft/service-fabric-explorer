import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ExperienceService } from 'src/app/services/experience.service';
import { ClipBoardComponent } from '../clip-board/clip-board.component';
import { DisplayTimeComponent } from './display-time.component';

describe('DisplayTimeComponent', () => {
  let fixture: ComponentFixture<DisplayTimeComponent>;
  let clipboard: jasmine.SpyObj<Clipboard>;
  let experience: { isNew: ReturnType<typeof signal<boolean>> };
  const timestamp = '2026-09-11T09:10:11.1234567+02:00';

  beforeEach(async () => {
    clipboard = jasmine.createSpyObj('Clipboard', ['copy']);
    clipboard.copy.and.returnValue(true);
    experience = { isNew: signal(true) };
    await TestBed.configureTestingModule({
      imports: [CommonModule, NgbTooltipModule],
      declarations: [DisplayTimeComponent, ClipBoardComponent],
      providers: [
        { provide: Clipboard, useValue: clipboard },
        { provide: LiveAnnouncer, useValue: jasmine.createSpyObj('LiveAnnouncer', ['announce']) },
        { provide: ExperienceService, useValue: experience }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DisplayTimeComponent);
    fixture.componentRef.setInput('time', timestamp);
  });

  it('copies the exact timestamp rather than the normalized datetime in New experience', () => {
    fixture.detectChanges();
    const time = fixture.nativeElement.querySelector('time') as HTMLTimeElement;
    expect(time.textContent).toBe(timestamp);
    expect(time.dateTime).toBe('2026-09-11T07:10:11.123Z');
    const copy = fixture.nativeElement.querySelector('app-clip-board button') as HTMLButtonElement;
    expect(copy.getAttribute('aria-label')).toBe('Copy timestamp');
    copy.click();
    expect(clipboard.copy).toHaveBeenCalledOnceWith(timestamp);
  });

  it('updates the displayed timestamp, datetime and exact copy payload on input changes', () => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('app-clip-board button').click();
    fixture.detectChanges();
    const updated = '2026-09-12T01:02:03.7654321-07:00';
    fixture.componentRef.setInput('time', updated);
    fixture.detectChanges();
    const time = fixture.nativeElement.querySelector('time') as HTMLTimeElement;
    expect(time.textContent).toBe(updated);
    expect(time.dateTime).toBe('2026-09-12T08:02:03.765Z');
    const copy = fixture.nativeElement.querySelector('app-clip-board button') as HTMLButtonElement;
    expect(copy.getAttribute('aria-label')).toBe('Copy timestamp');
    copy.click();
    expect(clipboard.copy.calls.allArgs()).toEqual([[timestamp], [updated]]);
  });

  it('preserves Classic markup without copy and reacts to experience changes', () => {
    experience.isNew.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mif-hour-glass')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(timestamp);
    expect(fixture.nativeElement.querySelector('app-clip-board')).toBeNull();
    expect(fixture.nativeElement.querySelector('time')).toBeNull();
    expect(fixture.nativeElement.querySelector('[tabindex="0"]')).not.toBeNull();
    experience.isNew.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mif-hour-glass')).toBeNull();
    expect(fixture.nativeElement.querySelector('time').textContent).toBe(timestamp);
    expect(fixture.nativeElement.querySelector('app-clip-board button')).not.toBeNull();
    experience.isNew.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-clip-board')).toBeNull();
    expect(clipboard.copy).not.toHaveBeenCalled();
  });

  it('refreshes elapsed time each second and stops on destruction', fakeAsync(() => {
    const update = spyOn(fixture.componentInstance, 'setTime').and.callThrough();
    fixture.detectChanges();
    tick(1000);
    expect(update).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.timeSince).not.toBe('');
    tick(1000);
    expect(update).toHaveBeenCalledTimes(2);
    fixture.destroy();
    tick(2000);
    expect(update).toHaveBeenCalledTimes(2);
  }));
});
