import { Component, inject } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    styleUrls: ['./toast-container.component.scss'],
    standalone: false
})
export class ToastContainerComponent {  toastService = inject(MessageService);


}
