import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    styleUrls: ['./toast-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ToastContainerComponent {  toastService = inject(MessageService);


}
