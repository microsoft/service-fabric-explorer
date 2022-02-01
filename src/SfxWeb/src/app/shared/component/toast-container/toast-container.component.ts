import { Component } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss']
})
export class ToastContainerComponent {

  constructor(public toastService: MessageService) {}

}
