import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface IMessageReceiver {
  showMessage(message: string, severity: MessageSeverity, durationMs?: number);
}

export enum MessageSeverity {
  Info, Warn, Err
}

export interface IMessage {
  message: string;
  severity: MessageSeverity;
  removeTimeout: Observable<any>;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor() { }

  private messageReceiver: IMessageReceiver;

  public registerMessageReceiver(messageReceiver: IMessageReceiver): MessageService {
      this.messageReceiver = messageReceiver;
      return this;
  }

  public showMessage(message: string, severity: MessageSeverity, durationMs?: number) {
      if (this.messageReceiver) {
          this.messageReceiver.showMessage(message, severity, durationMs);
      }
  }
}
