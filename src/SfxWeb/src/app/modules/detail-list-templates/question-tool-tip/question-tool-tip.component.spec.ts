import { Component, Input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ExperienceService } from 'src/app/services/experience.service';
import { QuestionToolTipComponent } from './question-tool-tip.component';

@Component({ selector: 'app-clip-board', template: '', standalone: false })
class ClipBoardStubComponent {
  @Input() text = '';
  @Input() name = '';
}

describe('QuestionToolTipComponent', () => {
  it('moves copy after the raw task ID only in New and preserves job indicators', async () => {
    const experience = { isNew: signal(false) };
    await TestBed.configureTestingModule({
      declarations: [QuestionToolTipComponent, ClipBoardStubComponent],
      imports: [NgbTooltipModule],
      providers: [{ provide: ExperienceService, useValue: experience }]
    }).compileComponents();
    const fixture = TestBed.createComponent(QuestionToolTipComponent);
    const rawTaskId = 'Azure/PlatformUpdate/<task>&id/2/4153';
    fixture.componentInstance.item = {
      raw: { TaskId: rawTaskId },
      concerningJobInfo: { description: 'Potentially stuck' },
      tooltipInfo: () => ({ type: 'Platform Update', tooltip: 'Repair task information' })
    } as unknown as RepairTask;

    for (const isNew of [false, true, false]) {
      experience.isNew.set(isNew);
      fixture.detectChanges();
      const copies = fixture.debugElement.queryAll(By.directive(ClipBoardStubComponent));
      expect(copies.length).toBe(1);
      expect(copies[0].componentInstance.text).toBe(rawTaskId);
      expect(copies[0].componentInstance.name).toBe('repair job task id');
      const container: HTMLElement = fixture.nativeElement.querySelector('div');
      const children = Array.from(container.childNodes);
      const valueIndex = children.findIndex(child => child.nodeType === Node.TEXT_NODE && child.textContent?.includes(rawTaskId));
      const copyIndex = children.indexOf(copies[0].nativeElement);
      expect(valueIndex).toBeGreaterThan(-1);
      expect(copyIndex > valueIndex).toBe(isNew);
      expect(container.querySelector('task')).toBeNull();
      expect(container.querySelector('.warning-icon')).not.toBeNull();
      expect(container.querySelector('.mif-info')).not.toBeNull();
    }
    fixture.destroy();
  });
});
