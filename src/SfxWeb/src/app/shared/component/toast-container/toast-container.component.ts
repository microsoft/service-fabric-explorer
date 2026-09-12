import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  host: { '[class.modern-toasts]': 'experience.isNew()' }
})
export class ToastContainerComponent {
  toastService = inject(MessageService);
  experience = inject(ExperienceService);
}
